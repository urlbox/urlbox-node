import { createHmac } from "node:crypto";
import { describe, expect, expectTypeOf, test } from "vitest";
import {
  parseWebhook,
  UrlboxWebhookSignatureError,
  verifyWebhookSignature,
} from "./index.js";
import type { WebhookEvent } from "./index.js";

const secret = "whsec_test";
const now = new Date("2026-10-21T12:00:00Z");
const t = Math.floor(now.getTime() / 1000);

const payload = {
  event: "render.succeeded",
  renderId: "a1b2c3",
  result: {
    renderUrl: "https://renders.urlbox.com/x.png",
    size: 1234,
    renders: 1,
  },
  meta: {
    startTime: "2026-10-21T11:59:58.000Z",
    endTime: "2026-10-21T12:00:00.000Z",
  },
};
const rawBody = JSON.stringify(payload);

const hmac = (key: string, timestamp: number, body: string) =>
  createHmac("sha256", key).update(`${timestamp}.${body}`).digest("hex");

const header = (keys: string[], timestamp = t, body = rawBody) =>
  `t=${timestamp},${keys.map((k) => `sha256=${hmac(k, timestamp, body)}`).join(",")}`;

describe("verifyWebhookSignature", () => {
  test("accepts a valid signature", () => {
    expect(
      verifyWebhookSignature({
        header: header([secret]),
        rawBody,
        secret,
        now,
      }),
    ).toBe(true);
  });

  test("accepts a Buffer body", () => {
    expect(
      verifyWebhookSignature({
        header: header([secret]),
        rawBody: Buffer.from(rawBody),
        secret,
        now,
      }),
    ).toBe(true);
  });

  test("accepts any signature in a rotation header", () => {
    const rotating = header(["whsec_old", secret]);
    expect(
      verifyWebhookSignature({ header: rotating, rawBody, secret, now }),
    ).toBe(true);
    expect(
      verifyWebhookSignature({
        header: rotating,
        rawBody,
        secret: "whsec_old",
        now,
      }),
    ).toBe(true);
  });

  test("accepts when any of several secrets matches", () => {
    expect(
      verifyWebhookSignature({
        header: header([secret]),
        rawBody,
        secret: ["whsec_new", secret],
        now,
      }),
    ).toBe(true);
  });

  test("rejects the wrong secret", () => {
    expect(
      verifyWebhookSignature({
        header: header([secret]),
        rawBody,
        secret: "nope",
        now,
      }),
    ).toBe(false);
  });

  test("rejects a tampered body", () => {
    expect(
      verifyWebhookSignature({
        header: header([secret]),
        rawBody: rawBody.replace("1234", "1235"),
        secret,
        now,
      }),
    ).toBe(false);
  });

  test("rejects an expired timestamp", () => {
    const old = t - 301;
    expect(
      verifyWebhookSignature({
        header: header([secret], old),
        rawBody,
        secret,
        now,
      }),
    ).toBe(false);
    expect(
      verifyWebhookSignature({
        header: header([secret], old),
        rawBody,
        secret,
        now,
        toleranceSeconds: 600,
      }),
    ).toBe(true);
  });

  test("tolerance 0 disables the timestamp check", () => {
    const ancient = t - 86_400 * 365;
    expect(
      verifyWebhookSignature({
        header: header([secret], ancient),
        rawBody,
        secret,
        now,
        toleranceSeconds: 0,
      }),
    ).toBe(true);
  });

  test("rejects missing or malformed headers", () => {
    for (const bad of [
      undefined,
      null,
      "",
      `sha256=${hmac(secret, t, rawBody)}`,
      `t=${t}`,
      `t=${t},sha256=abc`,
      `t=abc,sha256=${hmac(secret, t, rawBody)}`,
    ]) {
      expect(
        verifyWebhookSignature({ header: bad, rawBody, secret, now }),
      ).toBe(false);
    }
  });
});

describe("parseWebhook", () => {
  test("returns the typed payload", () => {
    const event = parseWebhook({
      header: header([secret]),
      rawBody,
      secret,
      now,
    });
    expectTypeOf(event).toEqualTypeOf<WebhookEvent>();
    expect(event).toEqual(payload);
    if (event.event === "render.succeeded") {
      expectTypeOf(event.result.renderUrl).toEqualTypeOf<string>();
      expect(event.result.renders).toBe(1);
    } else {
      expectTypeOf(event.error.message).toEqualTypeOf<string>();
      throw new Error("expected render.succeeded");
    }
  });

  test("parses a render.failed payload", () => {
    const failed = JSON.stringify({
      event: "render.failed",
      renderId: "a1b2c3",
      customId: "order-42",
      error: { message: "Timed out", code: "Timeout" },
      meta: payload.meta,
      result: { renders: 0 },
    });
    const event = parseWebhook({
      header: header([secret], t, failed),
      rawBody: failed,
      secret,
      now,
    });
    expect(event.event).toBe("render.failed");
    if (event.event === "render.failed") {
      expect(event.error.code).toBe("Timeout");
      expect(event.customId).toBe("order-42");
    }
  });

  test("throws UrlboxWebhookSignatureError when invalid", () => {
    expect(() =>
      parseWebhook({ header: header(["other"]), rawBody, secret, now }),
    ).toThrow(UrlboxWebhookSignatureError);
  });
});
