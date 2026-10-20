"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { MAX_AVATAR_BYTES } from "@/lib/images";
import { removeAvatar, updateDisplayName, uploadAvatar } from "@/server/actions/account";

type Feedback = { kind: "ok" | "error"; message: string } | null;

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p
      role={feedback.kind === "error" ? "alert" : "status"}
      className={
        feedback.kind === "error"
          ? "text-sm font-bold text-rose-700 dark:text-rose-300"
          : "text-sm font-bold text-emerald-700 dark:text-emerald-300"
      }
    >
      {feedback.message}
    </p>
  );
}

/** Display name (AUTH-05) and profile picture (AUTH-04) forms. */
export function ProfileEditor({ displayName, hasAvatar }: { displayName: string; hasAvatar: boolean }) {
  const { t } = useLanguage();
  const router = useRouter();
  const { update } = useSession();
  const [nameFeedback, setNameFeedback] = React.useState<Feedback>(null);
  const [avatarFeedback, setAvatarFeedback] = React.useState<Feedback>(null);
  const [pending, startTransition] = React.useTransition();

  return (
    <Card className="grid gap-6 md:grid-cols-2">
      <form
        className="space-y-2"
        action={(formData) =>
          startTransition(async () => {
            const result = await updateDisplayName(formData.get("displayName"));
            if (!result.success) return setNameFeedback({ kind: "error", message: result.error });
            await update(); // refreshes the name kept in the session token
            setNameFeedback({ kind: "ok", message: t("profile.saved") });
            router.refresh();
          })
        }
      >
        <label htmlFor="display-name" className="block text-sm font-black uppercase">
          {t("profile.displayName")}
        </label>
        <Input id="display-name" name="displayName" defaultValue={displayName} minLength={3} maxLength={20} required />
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t("guest.nicknameHint")}</p>
        <Button type="submit" variant="azure" size="sm" disabled={pending}>
          {t("profile.save")}
        </Button>
        <FeedbackLine feedback={nameFeedback} />
      </form>

      <form
        className="space-y-2"
        action={(formData) =>
          startTransition(async () => {
            const file = formData.get("avatar");
            // Quick client-side hint; the server checks again (SEC-02).
            if (file instanceof File && file.size > MAX_AVATAR_BYTES) {
              return setAvatarFeedback({ kind: "error", message: t("errors.avatarTooLarge") });
            }
            const result = await uploadAvatar(formData);
            setAvatarFeedback(
              result.success ? { kind: "ok", message: t("profile.saved") } : { kind: "error", message: result.error }
            );
            if (result.success) router.refresh();
          })
        }
      >
        <label htmlFor="avatar" className="block text-sm font-black uppercase">
          {t("profile.avatar")}
        </label>
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="block w-full text-sm font-bold file:mr-3 file:rounded-full file:border-2 file:border-slate-dark file:bg-white file:px-4 file:py-1.5 file:font-black dark:file:bg-zinc-800 dark:file:text-zinc-100"
        />
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t("profile.avatarHint")}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="azure" size="sm" disabled={pending}>
            {t("profile.upload")}
          </Button>
          {hasAvatar && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await removeAvatar();
                  router.refresh();
                })
              }
            >
              {t("profile.removeAvatar")}
            </Button>
          )}
        </div>
        <FeedbackLine feedback={avatarFeedback} />
      </form>
    </Card>
  );
}
