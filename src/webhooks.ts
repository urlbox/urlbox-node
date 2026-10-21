import { createHmac, timingSafeEqual } from "node:crypto";
import { UrlboxWebhookSignatureError } from "./errors.js";
import type { WebhookEvent } from "./responses.js";

const DEFAULT_TOLERANCE_SECONDS = 300;
const HEX_SHA256 = /^[0-9a-f]{64}$/i;

export interface VerifyWebhookArgs {
  /** The `X-Urlbox-Signature` header value. */
  header: string | null | undefined;
  /** The request body exactly as received, before any JSON parsing. */
  rawBody: string | Uint8Array;
  /** Your webhook secret, or several while rotating. */
  secret: string | string[];
  /** Maximum age of the signature timestamp. Default 300; 0 disables the check. */
  toleranceSeconds?: number;
  /** Override the current time (for tests). */
  now?: Date;
}

const parseHeader = (header: string) => {
  let timestamp: number | undefined;
  const signatures: Buffer[] = [];
  for (const part of header.split(",")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key === "t" && /^\d+$/.test(value)) {
      timestamp = Number(value);
    } else if (key === "sha256" && HEX_SHA256.test(value)) {
      signatures.push(Buffer.from(value, "hex"));
    }
  }
  return { timestamp, signatures };
};

const sign = (
  secret: string,
  timestamp: number,
  rawBody: string | Uint8Array,
) =>
  createHmac("sha256", secret).update(`${timestamp}.`).update(rawBody).digest();

/**
 * Checks an `X-Urlbox-Signature` header (`t=<unix>,sha256=<hex>[,sha256=<hex>…]`)
 * against the raw request body. Returns true when any signature matches any of
 * the given secrets and the timestamp is within tolerance.
 */
export function verifyWebhookSignature({
  header,
  rawBody,
  secret,
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
  now = new Date(),
}: VerifyWebhookArgs): boolean {
  if (!header) return false;
  const { timestamp, signatures } = parseHeader(header);
  if (timestamp === undefined || signatures.length === 0) return false;

  if (toleranceSeconds > 0) {
    const age = Math.abs(Math.floor(now.getTime() / 1000) - timestamp);
    if (age > toleranceSeconds) return false;
  }

  const secrets = (Array.isArray(secret) ? secret : [secret]).filter(Boolean);
  return secrets.some((s) => {
    const expected = sign(s, timestamp, rawBody);
    return signatures.some(
      (candidate) =>
        candidate.length === expected.length &&
        timingSafeEqual(candidate, expected),
    );
  });
}

/**
 * Verifies the signature and returns the parsed webhook payload.
 * Throws `UrlboxWebhookSignatureError` when the signature does not verify.
 */
export function parseWebhook(args: VerifyWebhookArgs): WebhookEvent {
  if (!verifyWebhookSignature(args)) {
    throw new UrlboxWebhookSignatureError();
  }
  const text =
    typeof args.rawBody === "string"
      ? args.rawBody
      : new TextDecoder().decode(args.rawBody);
  return JSON.parse(text) as WebhookEvent;
}
