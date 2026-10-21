export interface RateLimitInfo {
  /** `x-ratelimit-limit`: requests allowed in the current window. */
  limit?: number;
  /** `x-ratelimit-remaining`: requests left in the current window. */
  remaining?: number;
  /** `x-ratelimit-reset`: unix time (seconds) when the window resets. */
  reset?: number;
  /** `retry-after`: seconds to wait before retrying. */
  retryAfter?: number;
}

export interface UrlboxErrorDetails {
  status: number;
  requestId?: string;
  code?: string;
  body?: unknown;
  rateLimit?: RateLimitInfo;
}

/**
 * An error returned by the Urlbox API. `status` is the HTTP status, or 0 when
 * no response was received (network failure or timeout).
 */
export class UrlboxError extends Error {
  status: number;
  requestId?: string;
  code?: string;
  body?: unknown;
  rateLimit?: RateLimitInfo;

  constructor(message: string, details: UrlboxErrorDetails) {
    super(message);
    this.name = "UrlboxError";
    this.status = details.status;
    this.requestId = details.requestId;
    this.code = details.code;
    this.body = details.body;
    this.rateLimit = details.rateLimit;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown by `waitForRender` when the render finished with status `failed`. */
export class UrlboxRenderFailedError extends UrlboxError {
  constructor(message: string, details: UrlboxErrorDetails) {
    super(message, details);
    this.name = "UrlboxRenderFailedError";
  }
}

/** Thrown by `parseWebhook` when the `X-Urlbox-Signature` header does not verify. */
export class UrlboxWebhookSignatureError extends Error {
  constructor(message = "Invalid Urlbox webhook signature") {
    super(message);
    this.name = "UrlboxWebhookSignatureError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
