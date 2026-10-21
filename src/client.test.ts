import { describe, expect, test, vi } from "vitest";
import urlboxFactory, {
  Urlbox,
  UrlboxError,
  UrlboxRenderFailedError,
} from "./index.js";
import type { RenderStatus } from "./index.js";

type Call = { url: string; init: RequestInit };

const json = (
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

const mockFetch = (...responses: Response[]) => {
  const calls: Call[] = [];
  const fetch = vi.fn(
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      const next = responses.shift();
      if (!next) throw new Error("no more mock responses");
      return next;
    },
  );
  return { fetch: fetch as unknown as typeof globalThis.fetch, calls };
};

const client = (fetch: typeof globalThis.fetch, extra: object = {}) =>
  new Urlbox({ apiKey: "pubkey", secret: "sekret", fetch, ...extra });

const succeeded = {
  renderId: "r1",
  status: "succeeded",
  renderUrl: "https://renders.urlbox.com/r1.png",
  size: 2048,
};

describe("Urlbox.render", () => {
  test("posts options to /v1/render/sync with bearer auth", async () => {
    const body = {
      renderUrl: "https://renders.urlbox.com/x.png",
      size: 100,
      renderTime: 900,
    };
    const { fetch, calls } = mockFetch(json(200, body));
    const result = await client(fetch).render({
      url: "https://example.com",
      full_page: true,
    });

    expect(result).toEqual(body);
    expect(calls[0].url).toBe("https://api.urlbox.com/v1/render/sync");
    expect(calls[0].init.method).toBe("POST");
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer sekret");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(calls[0].init.body as string)).toEqual({
      url: "https://example.com",
      full_page: true,
    });
  });

  test("honours a custom baseUrl", async () => {
    const { fetch, calls } = mockFetch(json(200, { renderUrl: "x", size: 1 }));
    await client(fetch, { baseUrl: "https://api.example.test/" }).render({
      url: "a.com",
    });
    expect(calls[0].url).toBe("https://api.example.test/v1/render/sync");
  });

  test("maps a 4xx to UrlboxError with status, message, requestId and rate limit", async () => {
    const { fetch } = mockFetch(
      json(
        429,
        {
          error: { message: "Rate limit exceeded", code: "RateLimitExceeded" },
          requestId: "body-id",
        },
        {
          "x-urlbox-error-message": "Rate limit exceeded",
          "x-urlbox-request-id": "ps_123",
          "x-ratelimit-limit": "60",
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset": "1761048000",
          "retry-after": "12",
        },
      ),
    );
    const error = await client(fetch)
      .render({ url: "a.com" })
      .catch((e) => e);
    expect(error).toBeInstanceOf(UrlboxError);
    expect(error.status).toBe(429);
    expect(error.message).toBe("Rate limit exceeded");
    expect(error.code).toBe("RateLimitExceeded");
    expect(error.requestId).toBe("ps_123");
    expect(error.rateLimit).toEqual({
      limit: 60,
      remaining: 0,
      reset: 1761048000,
      retryAfter: 12,
    });
    expect(error.body).toEqual({
      error: { message: "Rate limit exceeded", code: "RateLimitExceeded" },
      requestId: "body-id",
    });
  });

  test("falls back to the body message and request id without headers", async () => {
    const { fetch } = mockFetch(
      json(400, {
        error: { message: "Invalid options", code: "InvalidOptions" },
        requestId: "ps_9",
      }),
    );
    const error = await client(fetch)
      .render({ url: "a.com" })
      .catch((e) => e);
    expect(error.message).toBe("Invalid options");
    expect(error.requestId).toBe("ps_9");
    expect(error.rateLimit).toBeUndefined();
  });

  test("times out", async () => {
    const fetch = ((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject(new Error("aborted")),
        );
      })) as unknown as typeof globalThis.fetch;
    const error = await client(fetch, { timeoutMs: 10 })
      .render({ url: "a.com" })
      .catch((e) => e);
    expect(error).toBeInstanceOf(UrlboxError);
    expect(error.status).toBe(0);
    expect(error.code).toBe("TIMEOUT");
  });
});

describe("Urlbox.renderAsync", () => {
  test("returns the created render", async () => {
    const created = {
      status: "created",
      renderId: "r1",
      statusUrl: "https://api.urlbox.com/v1/render/r1",
    };
    const { fetch, calls } = mockFetch(json(201, created));
    expect(await client(fetch).renderAsync({ url: "a.com" })).toEqual(created);
    expect(calls[0].url).toBe("https://api.urlbox.com/v1/render/async");
  });
});

describe("Urlbox.getRender", () => {
  const cases: RenderStatus[] = [
    {
      renderId: "r1",
      status: "created",
      statusUrl: "https://api.urlbox.com/v1/render/r1",
    },
    {
      renderId: "r1",
      status: "retrying",
      statusUrl: "https://api.urlbox.com/v1/render/r1",
      stalled: true,
    },
    { ...succeeded, status: "succeeded" },
    {
      renderId: "r1",
      status: "failed",
      reason: "Navigation timeout",
      statusCode: 504,
    },
  ];

  for (const body of cases) {
    test(`returns status ${body.status}`, async () => {
      const { fetch, calls } = mockFetch(json(200, body));
      expect(await client(fetch).getRender("r1")).toEqual(body);
      expect(calls[0].url).toBe("https://api.urlbox.com/v1/render/r1");
      expect(calls[0].init.method).toBe("GET");
    });
  }

  test("returns not-found from a 404 instead of throwing", async () => {
    const { fetch } = mockFetch(
      json(404, { renderId: "r1", status: "not-found" }),
    );
    expect(await client(fetch).getRender("r1")).toEqual({
      renderId: "r1",
      status: "not-found",
    });
  });

  test("throws on other errors", async () => {
    const { fetch } = mockFetch(new Response("Unauthorized", { status: 401 }));
    const error = await client(fetch)
      .getRender("r1")
      .catch((e) => e);
    expect(error).toBeInstanceOf(UrlboxError);
    expect(error.status).toBe(401);
    expect(error.message).toBe("Unauthorized");
  });
});

describe("Urlbox.waitForRender", () => {
  const pending = {
    renderId: "r1",
    status: "created",
    statusUrl: "https://api.urlbox.com/v1/render/r1",
  };

  test("polls until the render succeeds", async () => {
    const { fetch, calls } = mockFetch(
      json(200, pending),
      json(200, pending),
      json(200, succeeded),
    );
    const result = await client(fetch).waitForRender("r1", { intervalMs: 1 });
    expect(result).toEqual(succeeded);
    expect(calls).toHaveLength(3);
  });

  test("throws UrlboxRenderFailedError when the render fails", async () => {
    const failed = {
      renderId: "r1",
      status: "failed",
      reason: "Page returned 404",
    };
    const { fetch } = mockFetch(json(200, pending), json(200, failed));
    const error = await client(fetch)
      .waitForRender("r1", { intervalMs: 1 })
      .catch((e) => e);
    expect(error).toBeInstanceOf(UrlboxRenderFailedError);
    expect(error).toBeInstanceOf(UrlboxError);
    expect(error.message).toBe("Page returned 404");
    expect(error.body).toEqual(failed);
  });

  test("throws when the wait times out", async () => {
    const { fetch } = mockFetch(
      ...Array.from({ length: 50 }, () => json(200, pending)),
    );
    const error = await client(fetch)
      .waitForRender("r1", { intervalMs: 5, timeoutMs: 20 })
      .catch((e) => e);
    expect(error).toBeInstanceOf(UrlboxError);
    expect(error).not.toBeInstanceOf(UrlboxRenderFailedError);
    expect(error.code).toBe("WAIT_TIMEOUT");
  });
});

describe("Urlbox.generateRenderLink", () => {
  test("matches the legacy link generator", () => {
    const options = { url: "bbc.co.uk", width: 1024, full_page: true };
    const legacy = urlboxFactory(
      "pubkey",
      "sekret",
      "https://api.urlbox.com/v1/",
    );
    const urlbox = new Urlbox({ apiKey: "pubkey", secret: "sekret" });
    expect(urlbox.generateRenderLink(options)).toBe(
      legacy.generateRenderLink(options),
    );
    expect(urlbox.generateRenderLink(options, { insecure: true })).toBe(
      legacy.generateInsecureRenderLink(options),
    );
  });
});
