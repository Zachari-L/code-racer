"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { LOCALES, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE_SEC } from "@/lib/i18n";
import { getTranslator } from "@/lib/i18n/server";

const setLocaleSchema = z.enum(LOCALES);

/** Persists the UI locale. Setting a cookie re-renders the current page and layouts. */
export async function setLocale(
  input: unknown
): Promise<{ success: true } | { success: false; error: string }> {
  const result = setLocaleSchema.safeParse(input);
  if (!result.success) {
    const t = await getTranslator();
    return { success: false, error: t("errors.invalidLocale") };
  }

  (await cookies()).set(LOCALE_COOKIE, result.data, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE_SEC,
    sameSite: "lax",
  });
  return { success: true };
}
