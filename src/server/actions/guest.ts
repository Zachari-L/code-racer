"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { GUEST_COOKIE, GUEST_COOKIE_MAX_AGE_SEC, nicknameSchema } from "@/lib/identity";
import { translateZodError } from "@/lib/i18n";
import { getTranslator } from "@/lib/i18n/server";
import { getAuthSecret, signPayload } from "@/lib/signing";
import { getGuestSession } from "@/server/identity";

/**
 * Starts (or renames) a guest session: the pseudonym is kept in a signed,
 * HTTP-only cookie (AUTH-02). The guest id survives a rename.
 */
export async function startGuestSession(
  input: unknown
): Promise<{ success: true; nickname: string } | { success: false; error: string }> {
  const t = await getTranslator();
  const parsed = nicknameSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: translateZodError(t, parsed.error, "errors.invalidData") };
  }

  const existing = await getGuestSession();
  const session = { id: existing?.id ?? `g_${randomUUID()}`, nickname: parsed.data };
  (await cookies()).set(GUEST_COOKIE, signPayload(session, getAuthSecret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE_SEC,
  });
  return { success: true, nickname: session.nickname };
}
