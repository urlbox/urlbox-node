import { UrlboxError, UrlboxRenderFailedError } from "./errors.js";
import type { RateLimitInfo } from "./errors.js";
import { buildRenderLink } from "./render-link.js";
import type {
  AsyncRenderCreated,
  RenderResult,
  RenderStatus,
  RenderSucceeded,
} from "./responses.js";
import type { RenderOptions } from "./types.js";

const DEFAULT_BASE_URL = "https://api.urlbox.com";
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_POLL_INTERVAL_MS = 2_000;
const DEFAULT_WAIT_TIMEOUT_MS = 300_000;

export interface UrlboxOptions {
  /** Your project's publishable API key. */
  apiKey: string;
  /** Your project's secret key. */
  secret: string;
  /** Default `https://api.urlbox.com`. */
  baseUrl?: string;
  /** A `fetch` implementation. Defaults to the global `fetch`. */
  fetch?: typeof fetch;
  /** Per-request timeout. Default 120000. */
  timeoutMs?: number;
}

export interface WaitForRenderOptions {
  /** Delay between polls. Default 2000. */
  intervalMs?: number;
  /** Give up after this long. Default 300000. */
  timeoutMs?: number;
}

const numberHeader = (headers: Headers, name: string) => {
  const value = headers.get(name);
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const rateLimitFrom = (headers: Headers): RateLimitInfo | undefined => {
  const info: RateLimitInfo = {
    limit: numberHeader(headers, "x-ratelimit-limit"),
    remaining: numberHeader(headers, "x-ratelimit-remaining"),
    reset: numberHeader(headers, "x-ratelimit-reset"),
    retryAfter: numberHeader(headers, "retry-after"),
  };
  return Object.values(info).some((v) => v !== undefined) ? info : undefined;
};

const readBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const errorFields = (
  body: unknown,
): { message?: string; code?: string; requestId?: string } => {
  if (typeof body !== "object" || body === null) {
    return typeof body === "string" && body ? { message: body } : {};
  }
  const record = body as Record<string, unknown>;
  const error =
    typeof record.error === "object" && record.error !== null
      ? (record.error as Record<string, unknown>)
      : record;
  const asString = (v: unknown) => (typeof v === "string" ? v : undefined);
  return {
    message: asString(error.message) ?? asString(record.error),
    code: asString(error.code),
    requestId: asString(record.requestId),
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Client for the Urlbox render API.
 *
 * ```ts
 * const urlbox = new Urlbox({ apiKey, secret });
 * const { renderUrl } = await urlbox.render({ url: "https://example.com" });
 * ```
 */
export class Urlbox {
  private readonly apiKey: string;
  private readonly secret: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(opts: UrlboxOptions) {
    if (!opts?.apiKey) throw new Error("apiKey is required");
    if (!opts.secret) throw new Error("secret is required");
    const fetchImpl = opts.fetch ?? globalThis.fetch;
    if (!fetchImpl) {
      throw new Error("No fetch implementation found; pass one as `fetch`");
    }
    this.apiKey = opts.apiKey;
    this.secret = opts.secret;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.fetchImpl = fetchImpl;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /** Renders synchronously and returns the JSON result (`POST /v1/render/sync`). */
  render(options: RenderOptions): Promise<RenderResult> {
    return this.request<RenderResult>("POST", "/v1/render/sync", options);
  }

  /** Queues a render (`POST /v1/render/async`). Use `getRender` or `waitForRender` for the result. */
  renderAsync(options: RenderOptions): Promise<AsyncRenderCreated> {
    return this.request<AsyncRenderCreated>(
      "POST",
      "/v1/render/async",
      options,
    );
  }

  /** Fetches a render's status (`GET /v1/render/:renderId`). */
  getRender(renderId: string): Promise<RenderStatus> {
    return this.request<RenderStatus>(
      "GET",
      `/v1/render/${encodeURIComponent(renderId)}`,
      undefined,
      (status, body) =>
        status === 404 &&
        typeof body === "object" &&
        body !== null &&
        (body as { status?: unknown }).status === "not-found",
    );
  }

  /**
   * Polls `getRender` until the render succeeds. Throws `UrlboxRenderFailedError`
   * if it fails, and `UrlboxError` if it is not found or the wait times out.
   */
  async waitForRender(
    renderId: string,
    opts: WaitForRenderOptions = {},
  ): Promise<RenderSucceeded> {
    const intervalMs = opts.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const deadline = Date.now() + (opts.timeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS);
    for (;;) {
      const status = await this.getRender(renderId);
      switch (status.status) {
        case "succeeded":
          return status;
        case "failed":
          throw new UrlboxRenderFailedError(status.reason ?? "Render failed", {
            status: 200,
            code: "RENDER_FAILED",
            body: status,
          });
        case "not-found":
          throw new UrlboxError(`Render ${renderId} not found`, {
            status: 404,
            code: "RENDER_NOT_FOUND",
            body: status,
          });
      }
      if (Date.now() + intervalMs > deadline) {
        throw new UrlboxError(`Timed out waiting for render ${renderId}`, {
          status: 0,
          code: "WAIT_TIMEOUT",
          body: status,
        });
      }
      await sleep(intervalMs);
    }
  }

  /**
   * Builds a signed render link for these options (unsigned with `insecure`),
   * using the same algorithm as the default export.
   */
  generateRenderLink(
    options: RenderOptions,
    opts: { insecure?: boolean } = {},
  ): string {
    return buildRenderLink(
      `${this.baseUrl}/v1/`,
      this.apiKey,
      options,
      opts.insecure ? undefined : this.secret,
    );
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    acceptError?: (status: number, body: unknown) => boolean,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    let parsed: unknown;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.secret}`,
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      parsed = await readBody(response);
    } catch (error) {
      const timedOut = controller.signal.aborted;
      throw new UrlboxError(
        timedOut
          ? `Request timed out after ${this.timeoutMs}ms`
          : `Request failed: ${error instanceof Error ? error.message : String(error)}`,
        { status: 0, code: timedOut ? "TIMEOUT" : "NETWORK_ERROR" },
      );
    } finally {
      clearTimeout(timer);
    }

    if (response.ok || acceptError?.(response.status, parsed)) {
      if (typeof parsed !== "object" || parsed === null) {
        throw new UrlboxError("Expected a JSON response from the Urlbox API", {
          status: response.status,
          requestId: response.headers.get("x-urlbox-request-id") ?? undefined,
          body: parsed,
        });
      }
      return parsed as T;
    }

    const fields = errorFields(parsed);
    throw new UrlboxError(
      response.headers.get("x-urlbox-error-message") ??
        fields.message ??
        `Urlbox API responded with HTTP ${response.status}`,
      {
        status: response.status,
        requestId:
          response.headers.get("x-urlbox-request-id") ?? fields.requestId,
        code: fields.code,
        body: parsed,
        rateLimit: rateLimitFrom(response.headers),
      },
    );
  }
}
