"use client";

import * as React from "react";
import { Gauge, Target } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { ErrorMode } from "@/lib/game/config";
import {
  applyKey,
  computeRaceStats,
  createTypingState,
  retargetText,
  type KeyInput,
  type TypingState,
} from "@/lib/game/typing";
import { INPUT_FLUSH_MS, type SelfState } from "@/lib/realtime/protocol";
import { cn } from "@/lib/utils";

interface TypingZoneProps {
  text: string;
  errorMode: ErrorMode;
  /** Server time when typing opens. */
  goAt: number;
  serverNow: () => number;
  /** Latest personal state from the server (resync or bonus text change). */
  self: { state: SelfState; reason: "resync" | "text" } | null;
  disabled: boolean;
  onKeys: (keys: KeyInput[]) => void;
}

function toTypingState(self: SelfState): TypingState {
  return {
    typed: self.typed,
    keystrokes: self.keystrokes,
    correctKeystrokes: self.correctKeystrokes,
    errors: self.errors,
    missedKeys: self.missedKeys,
  };
}

/**
 * Typing area (COURSE-04): instant feedback per character, live WPM and
 * accuracy, paste disabled. Keystrokes are applied locally with the same
 * engine as the server and sent in batches (PERF-02).
 */
export function TypingZone({
  text: initialText,
  errorMode,
  goAt,
  serverNow,
  self,
  disabled,
  onKeys,
}: TypingZoneProps) {
  const { t } = useLanguage();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [text, setText] = React.useState(initialText);
  const [typing, setTyping] = React.useState<TypingState>(createTypingState);
  const [now, setNow] = React.useState(() => serverNow());
  const [focused, setFocused] = React.useState(false);
  const [lastSelf, setLastSelf] = React.useState(self);
  const pending = React.useRef<KeyInput[]>([]);

  // Adopt server state when it changes (render-time sync, no effect needed).
  if (self !== lastSelf) {
    setLastSelf(self);
    if (self) {
      setText(self.state.text);
      setTyping((current) =>
        self.reason === "resync"
          ? toTypingState(self.state)
          : retargetText(current, self.state.text)
      );
    }
  }

  // After a resync the unsent keys belong to the discarded state.
  React.useEffect(() => {
    if (self?.reason === "resync") pending.current = [];
  }, [self]);

  React.useEffect(() => {
    const flush = setInterval(() => {
      if (pending.current.length === 0) return;
      onKeys(pending.current);
      pending.current = [];
    }, INPUT_FLUSH_MS);
    const clock = setInterval(() => setNow(serverNow()), 250);
    return () => {
      clearInterval(flush);
      clearInterval(clock);
    };
  }, [onKeys, serverNow]);

  React.useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const push = React.useCallback(
    (key: KeyInput) => {
      if (disabled || serverNow() < goAt) return;
      setTyping((current) => applyKey(current, text, key, errorMode));
      pending.current.push(key);
    },
    [disabled, errorMode, goAt, serverNow, text]
  );

  // `beforeinput` covers every layout, accents and dead keys included.
  React.useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const onBeforeInput = (event: InputEvent) => {
      if (event.inputType === "insertCompositionText") return;
      event.preventDefault();
      if (event.inputType === "deleteContentBackward") push({ k: "b" });
      else if (event.inputType === "insertText" && event.data) {
        for (const c of event.data) push({ k: "c", c });
      }
    };
    const onCompositionEnd = (event: CompositionEvent) => {
      for (const c of event.data) push({ k: "c", c });
      input.value = "";
    };
    input.addEventListener("beforeinput", onBeforeInput);
    input.addEventListener("compositionend", onCompositionEnd);
    return () => {
      input.removeEventListener("beforeinput", onBeforeInput);
      input.removeEventListener("compositionend", onCompositionEnd);
    };
  }, [push]);

  const elapsed = Math.max(0, now - goAt);
  const stats = computeRaceStats(typing, text, elapsed);
  const cursor = typing.typed.length;
  const fogged = self?.state.fogUntil != null && now < self.state.fogUntil;
  const nextSpace = text.indexOf(" ", cursor);
  const fogFrom = nextSpace === -1 ? text.length : nextSpace;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2" aria-live="off">
        <span className="bg-electric-lime border-slate-dark flex items-center gap-1.5 rounded-full border-2 px-3 py-0.5 text-xs font-black text-[#111112]">
          <Gauge className="h-3.5 w-3.5" aria-hidden />
          {t("race.wpmValue", { wpm: Math.round(stats.wpm) })}
        </span>
        <span className="border-slate-dark flex items-center gap-1.5 rounded-full border-2 bg-white px-3 py-0.5 text-xs font-black dark:border-zinc-600 dark:bg-zinc-800">
          <Target className="text-victory-teal h-3.5 w-3.5" aria-hidden />
          {t("race.accuracyValue", { accuracy: Math.round(stats.accuracy) })}
        </span>
        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
          {t(errorMode === "STRICT" ? "race.strictHint" : "race.freeHint")}
        </span>
      </div>

      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "relative min-h-28 cursor-text rounded-2xl border-3 bg-zinc-50 p-4 font-mono text-lg leading-relaxed break-words select-none sm:text-xl dark:bg-zinc-800/60",
          focused ? "border-azure-blue" : "border-slate-dark/30 dark:border-zinc-700"
        )}
      >
        <label htmlFor="typing-input" className="sr-only">
          {t("race.typingInputAria")}
        </label>
        <input
          id="typing-input"
          ref={inputRef}
          type="text"
          defaultValue=""
          disabled={disabled}
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === "Tab" || e.key === "Enter") e.preventDefault();
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
        />
        <p aria-hidden className="whitespace-pre-wrap">
          {[...text].map((char, index) => {
            const typedChar = typing.typed[index];
            const state =
              index < cursor
                ? typedChar === char
                  ? "ok"
                  : "bad"
                : index === cursor
                  ? "cursor"
                  : "todo";
            return (
              <span
                // Re-keying the cursor replays the error flash after each strict-mode miss.
                key={state === "cursor" ? `cursor-${index}-${typing.errors}` : index}
                className={cn(
                  "relative",
                  state === "ok" && "text-emerald-700 dark:text-emerald-400",
                  state === "bad" &&
                    "rounded-sm bg-rose-500/25 text-rose-700 underline decoration-2 dark:text-rose-300",
                  state === "todo" && "text-zinc-500 dark:text-zinc-400",
                  state === "cursor" &&
                    "border-azure-blue border-b-3 text-zinc-900 dark:text-white",
                  state === "cursor" &&
                    errorMode === "STRICT" &&
                    typing.errors > 0 &&
                    "animate-error-flash",
                  fogged && index > fogFrom && "blur-[3px]"
                )}
              >
                {char}
              </span>
            );
          })}
        </p>
        {!focused && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70 font-sans text-sm font-black dark:bg-zinc-900/70">
            {t("race.clickToFocus")}
          </div>
        )}
      </div>
    </div>
  );
}
