/**
 * Tamper-proof tokens: `base64url(json).base64url(hmac-sha256)`. Used for the
 * guest session cookie (AUTH-02) and the short-lived realtime ticket. Server
 * only: the secret never reaches the browser.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { z } from "zod";

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function signPayload(payload: unknown, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data, secret)}`;
}

/** Returns the payload if the signature matches and it fits `schema`, else `null`. */
export function verifyPayload<T>(
  token: string | undefined | null,
  secret: string,
  schema: z.ZodType<T>
): T | null {
  if (!token) return null;
  const [data, signature, ...rest] = token.split(".");
  if (!data || !signature || rest.length > 0) return null;

  const expected = Buffer.from(sign(data, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const parsed = schema.safeParse(JSON.parse(Buffer.from(data, "base64url").toString("utf8")));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Signing secret shared by Auth.js and the app tokens. */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}
