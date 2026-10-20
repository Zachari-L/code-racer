"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { ROOM_CODE_LENGTH, isRoomCode, normalizeRoomCode } from "@/lib/room-code";

/** Join by code, right from the home page (JOIN-01). */
export function JoinByCodeForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState(false);

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const normalized = normalizeRoomCode(code);
        if (!isRoomCode(normalized)) {
          setError(true);
          return;
        }
        router.push(`/room/${normalized}`);
      }}
    >
      <label htmlFor="room-code" className="block text-sm font-black uppercase">
        {t("home.codeLabel")}
      </label>
      <div className="flex gap-2">
        <Input
          id="room-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(false);
          }}
          maxLength={ROOM_CODE_LENGTH + 2}
          autoComplete="off"
          spellCheck={false}
          placeholder="AB3K9Q"
          aria-invalid={error}
          aria-describedby={error ? "room-code-error" : undefined}
          className="font-mono text-lg tracking-[0.3em] uppercase"
        />
        <Button type="submit" variant="lime" aria-label={t("home.joinButton")}>
          <ArrowRight className="h-5 w-5" aria-hidden />
          <span className="ml-1 hidden sm:inline">{t("home.joinButton")}</span>
        </Button>
      </div>
      {error && (
        <p
          id="room-code-error"
          role="alert"
          className="text-sm font-bold text-rose-700 dark:text-rose-300"
        >
          {t("validation.roomCode")}
        </p>
      )}
    </form>
  );
}
