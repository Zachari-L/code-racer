"use client";

import * as React from "react";
import { Bot, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { botName } from "@/lib/game/bot-names";
import {
  BOT_LEVELS,
  COMPLEXITIES,
  ERROR_MODES,
  MAX_CAPACITY,
  MAX_TIME_LIMIT_SEC,
  MAX_WORD_COUNT,
  MIN_CAPACITY,
  MIN_TIME_LIMIT_SEC,
  MIN_WORD_COUNT,
  TEXT_MODES,
  VISIBILITIES,
  type BotLevel,
  type RoomConfig,
} from "@/lib/game/config";
import { LOCALES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ConfigFormProps {
  value: RoomConfig;
  onChange: (config: RoomConfig) => void;
  /** Hides visibility/capacity when they are edited elsewhere. */
  idPrefix: string;
}

const fieldset = "space-y-2 rounded-2xl border-2 border-zinc-200 p-3 dark:border-zinc-700";
const legend = "px-1 text-xs font-black tracking-wider uppercase";
const control =
  "border-slate-dark h-10 rounded-full border-2 bg-white px-3 text-sm font-bold dark:border-zinc-600 dark:bg-zinc-800";

function Choice<T extends string>({
  name,
  options,
  value,
  label,
  onChange,
}: {
  name: string;
  options: readonly T[];
  value: T;
  label: (option: T) => string;
  onChange: (option: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <label
          key={option}
          className={cn(
            "arcade-clickable has-[:focus-visible]:outline-azure-blue cursor-pointer rounded-full border-2 px-3 py-1 text-xs font-black has-[:focus-visible]:outline-3",
            option === value
              ? "border-slate-dark bg-azure-deep text-white"
              : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800"
          )}
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={option === value}
            onChange={() => onChange(option)}
            className="sr-only"
          />
          {label(option)}
        </label>
      ))}
    </div>
  );
}

/** Number input that only commits a value on blur or Enter, clamped to its range. */
function NumberField({
  id,
  value,
  min,
  max,
  onCommit,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = React.useState(String(value));
  const [synced, setSynced] = React.useState(value);
  if (value !== synced) {
    setSynced(value);
    setDraft(String(value));
  }
  const commit = () => {
    const parsed = Math.round(Number(draft));
    const next = Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : value;
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };
  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      className={cn(control, "w-28")}
    />
  );
}

function Toggle({
  id,
  checked,
  label,
  disabled,
  onChange,
}: {
  id: string;
  checked: boolean;
  label: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn("flex items-center gap-2 text-sm font-bold", disabled && "opacity-50")}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-azure-blue h-4 w-4"
      />
      {label}
    </label>
  );
}

export function ConfigForm({ value, onChange, idPrefix }: ConfigFormProps) {
  const { t } = useLanguage();
  const set = <K extends keyof RoomConfig>(key: K, next: RoomConfig[K]) =>
    onChange({ ...value, [key]: next });
  const id = (name: string) => `${idPrefix}-${name}`;
  const random = value.textMode === "RANDOM";

  const addBot = (level: BotLevel) =>
    set("bots", [...value.bots, { id: `bot-${crypto.randomUUID().slice(0, 8)}`, level }]);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <fieldset className={fieldset}>
        <legend className={legend}>{t("config.access")}</legend>
        <Choice
          name={id("visibility")}
          options={VISIBILITIES}
          value={value.visibility}
          label={(v) => t(`config.visibility.${v}`)}
          onChange={(v) => set("visibility", v)}
        />
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          {t(`config.visibilityHint.${value.visibility}`)}
        </p>
        <label
          htmlFor={id("capacity")}
          className="flex items-center justify-between gap-2 text-sm font-bold"
        >
          {t("config.capacity", { min: MIN_CAPACITY, max: MAX_CAPACITY })}
          <NumberField
            id={id("capacity")}
            value={value.capacity}
            min={Math.max(MIN_CAPACITY, value.bots.length)}
            max={MAX_CAPACITY}
            onCommit={(v) => set("capacity", v)}
          />
        </label>
      </fieldset>

      <fieldset className={fieldset}>
        <legend className={legend}>{t("config.race")}</legend>
        <Toggle
          id={id("no-limit")}
          checked={value.timeLimitSec === null}
          label={t("config.noTimeLimit")}
          onChange={(checked) => set("timeLimitSec", checked ? null : 120)}
        />
        {value.timeLimitSec !== null && (
          <label
            htmlFor={id("time")}
            className="flex items-center justify-between gap-2 text-sm font-bold"
          >
            {t("config.timeLimit", { min: MIN_TIME_LIMIT_SEC, max: MAX_TIME_LIMIT_SEC })}
            <NumberField
              id={id("time")}
              value={value.timeLimitSec}
              min={MIN_TIME_LIMIT_SEC}
              max={MAX_TIME_LIMIT_SEC}
              onCommit={(v) => set("timeLimitSec", v)}
            />
          </label>
        )}
        <p className="text-sm font-bold">{t("config.errorMode")}</p>
        <Choice
          name={id("error-mode")}
          options={ERROR_MODES}
          value={value.errorMode}
          label={(v) => t(`config.errorModes.${v}`)}
          onChange={(v) => set("errorMode", v)}
        />
        <Toggle
          id={id("bonuses")}
          checked={value.bonuses}
          label={t("config.bonuses")}
          onChange={(checked) => set("bonuses", checked)}
        />
      </fieldset>

      <fieldset className={fieldset}>
        <legend className={legend}>{t("config.text")}</legend>
        <p className="text-sm font-bold">{t("config.language")}</p>
        <Choice
          name={id("language")}
          options={LOCALES}
          value={value.language}
          label={(v) => t(`config.languages.${v}`)}
          onChange={(v) => set("language", v)}
        />
        <p className="text-sm font-bold">{t("config.textMode")}</p>
        <Choice
          name={id("text-mode")}
          options={TEXT_MODES}
          value={value.textMode}
          label={(v) => t(`config.textModes.${v}`)}
          onChange={(v) => set("textMode", v)}
        />
        <label
          htmlFor={id("words")}
          className="flex items-center justify-between gap-2 text-sm font-bold"
        >
          {t("config.wordCount", { min: MIN_WORD_COUNT, max: MAX_WORD_COUNT })}
          <NumberField
            id={id("words")}
            value={value.wordCount}
            min={MIN_WORD_COUNT}
            max={MAX_WORD_COUNT}
            onCommit={(v) => set("wordCount", v)}
          />
        </label>
        <p className="text-sm font-bold">{t("config.complexity")}</p>
        <Choice
          name={id("complexity")}
          options={COMPLEXITIES}
          value={value.complexity}
          label={(v) => t(`config.complexities.${v}`)}
          onChange={(v) => set("complexity", v)}
        />
      </fieldset>

      <fieldset className={fieldset}>
        <legend className={legend}>{t("config.characters")}</legend>
        <div className="grid grid-cols-2 gap-1.5">
          <Toggle
            id={id("punct")}
            checked={value.punctuation}
            label={t("config.punctuation")}
            onChange={(c) => set("punctuation", c)}
          />
          <Toggle
            id={id("numbers")}
            checked={value.numbers}
            label={t("config.numbers")}
            onChange={(c) => set("numbers", c)}
          />
          <Toggle
            id={id("caps")}
            checked={value.capitals}
            label={t("config.capitals")}
            onChange={(c) => set("capitals", c)}
          />
          <Toggle
            id={id("accents")}
            checked={value.accents}
            disabled={value.language !== "fr"}
            label={t("config.accents")}
            onChange={(c) => set("accents", c)}
          />
        </div>
        {(["includeChars", "excludeChars"] as const).map((key) => (
          <label key={key} htmlFor={id(key)} className="flex flex-col gap-1 text-sm font-bold">
            {t(`config.${key}`)}
            <input
              id={id(key)}
              type="text"
              maxLength={30}
              disabled={!random}
              defaultValue={value[key]}
              key={value[key]}
              onBlur={(e) =>
                e.target.value !== value[key] && set(key, e.target.value.toLowerCase())
              }
              className={cn(control, "font-mono disabled:opacity-50")}
            />
          </label>
        ))}
        {!random && (
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            {t("config.charFiltersRandomOnly")}
          </p>
        )}
      </fieldset>

      <fieldset className={cn(fieldset, "md:col-span-2")}>
        <legend className={legend}>{t("config.bots")}</legend>
        <ul className="space-y-1.5">
          {value.bots.map((bot) => (
            <li key={bot.id} className="flex flex-wrap items-center gap-2">
              <Bot className="text-azure-blue h-4 w-4" aria-hidden />
              <span className="w-24 text-sm font-black">{botName(bot.id)}</span>
              <label className="sr-only" htmlFor={id(`level-${bot.id}`)}>
                {t("config.botLevel")}
              </label>
              <select
                id={id(`level-${bot.id}`)}
                value={bot.level}
                onChange={(e) =>
                  set(
                    "bots",
                    value.bots.map((b) =>
                      b.id === bot.id ? { ...b, level: e.target.value as BotLevel } : b
                    )
                  )
                }
                className={control}
              >
                {BOT_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {t(`bot.level.${level}`)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  set(
                    "bots",
                    value.bots.filter((b) => b.id !== bot.id)
                  )
                }
                className="arcade-clickable rounded-full p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                aria-label={t("config.removeBot", { name: botName(bot.id) })}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-1.5">
          {BOT_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              disabled={value.bots.length >= value.capacity - 1}
              onClick={() => addBot(level)}
              className="arcade-clickable flex items-center gap-1 rounded-full border-2 border-zinc-300 px-3 py-1 text-xs font-black disabled:opacity-40 dark:border-zinc-600"
            >
              <Plus className="h-3 w-3" aria-hidden />
              {t(`bot.level.${level}`)}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/** Read-only view of the configuration for everyone but the host (CONF-12). */
export function ConfigSummary({ config }: { config: RoomConfig }) {
  const { t } = useLanguage();
  const yes = t("common.yes");
  const no = t("common.no");
  const rows: [string, string][] = [
    [t("config.visibilityLabel"), t(`config.visibility.${config.visibility}`)],
    [t("config.capacityLabel"), String(config.capacity)],
    [
      t("config.timeLimitLabel"),
      config.timeLimitSec === null
        ? t("config.noTimeLimit")
        : t("results.seconds", { value: config.timeLimitSec }),
    ],
    [t("config.language"), t(`config.languages.${config.language}`)],
    [t("config.textMode"), t(`config.textModes.${config.textMode}`)],
    [t("config.wordCountLabel"), String(config.wordCount)],
    [t("config.complexity"), t(`config.complexities.${config.complexity}`)],
    [t("config.punctuation"), config.punctuation ? yes : no],
    [t("config.numbers"), config.numbers ? yes : no],
    [t("config.capitals"), config.capitals ? yes : no],
    [t("config.accents"), config.accents ? yes : no],
    [t("config.errorMode"), t(`config.errorModes.${config.errorMode}`)],
    [t("config.bonuses"), config.bonuses ? yes : no],
  ];
  if (config.textMode === "RANDOM" && config.includeChars)
    rows.push([t("config.includeChars"), config.includeChars]);
  if (config.textMode === "RANDOM" && config.excludeChars)
    rows.push([t("config.excludeChars"), config.excludeChars]);

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col">
          <dt className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{label}</dt>
          <dd className="font-black">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
