"use strict";
import { buildRenderLink } from "./render-link.js";
import type { RenderOptions } from "./types.js";

const DEFAULT_PREFIX = "https://api.urlbox.io/v1/";

export default (
  key: string,
  secret?: string,
  prefix: string = DEFAULT_PREFIX,
) => {
  return {
    generateRenderLink: (options: RenderOptions) => {
      if (!secret) {
        throw new Error("your secret is required");
      }
      return buildRenderLink(prefix, key, options, secret);
    },
    generateInsecureRenderLink: (options: RenderOptions) =>
      buildRenderLink(prefix, key, options),
  };
};

export type { RenderOptions };

export { Urlbox } from "./client.js";
export type { UrlboxOptions, WaitForRenderOptions } from "./client.js";
export { verifyWebhookSignature, parseWebhook } from "./webhooks.js";
export type { VerifyWebhookArgs } from "./webhooks.js";
export {
  UrlboxError,
  UrlboxRenderFailedError,
  UrlboxWebhookSignatureError,
} from "./errors.js";
export type { RateLimitInfo } from "./errors.js";
export type {
  RenderResult,
  AsyncRenderCreated,
  RenderStatus,
  RenderPending,
  RenderSucceeded,
  RenderFailed,
  RenderNotFound,
  RenderResponseInfo,
  ThumbnailResult,
  SliceResult,
  BlockDetectionResult,
  UnblockSummary,
  WebhookEvent,
  WebhookMeta,
  WebhookRenderSucceeded,
  WebhookRenderFailed,
} from "./responses.js";
