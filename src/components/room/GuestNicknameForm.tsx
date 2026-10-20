"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/ui/link-button";
import { useLanguage } from "@/context/LanguageContext";
import { startGuestSession } from "@/server/actions/guest";

/** Pseudonym prompt for visitors without an account (AUTH-02). */
export function GuestNicknameForm({ callbackUrl }: { callbackUrl: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  return (
    <Card className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-2xl font-black uppercase">{t("guest.title")}</h1>
      <p className="text-sm font-semibold">{t("guest.description")}</p>
      <form
        className="space-y-3"
        action={(formData) =>
          startTransition(async () => {
            const result = await startGuestSession(formData.get("nickname"));
            if (result.success) router.refresh();
            else setError(result.error);
          })
        }
      >
        <label htmlFor="guest-nickname" className="block text-sm font-black">
          {t("guest.nicknameLabel")}
        </label>
        <Input
          id="guest-nickname"
          name="nickname"
          required
          minLength={3}
          maxLength={20}
          autoComplete="nickname"
          aria-describedby={error ? "guest-error" : "guest-hint"}
          aria-invalid={error !== null}
        />
        <p id="guest-hint" className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          {t("guest.nicknameHint")}
        </p>
        {error && (
          <p
            id="guest-error"
            role="alert"
            className="text-sm font-bold text-rose-700 dark:text-rose-300"
          >
            {error}
          </p>
        )}
        <Button type="submit" variant="lime" className="w-full" disabled={pending}>
          {t("guest.submit")}
        </Button>
      </form>
      <div className="border-t-2 border-zinc-200 pt-3 text-center dark:border-zinc-700">
        <LinkButton
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          variant="outline"
          size="sm"
        >
          {t("guest.signInInstead")}
        </LinkButton>
      </div>
    </Card>
  );
}
