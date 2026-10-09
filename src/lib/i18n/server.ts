import { cache } from "react";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, negotiateLocale, type Locale } from "./config";
import { createTranslator, type Translator } from "./translator";

/** Request locale: the `coderacer_locale` cookie, else the browser's Accept-Language. */
export const getLocale = cache(async (): Promise<Locale> => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;
  return negotiateLocale((await headers()).get("accept-language"));
});

export async function getTranslator(): Promise<Translator> {
  return createTranslator(await getLocale());
}
