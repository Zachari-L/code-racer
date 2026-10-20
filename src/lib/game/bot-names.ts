import { hashString } from "./random";

const BOT_NAMES = [
  "Nova",
  "Turbo",
  "Pixel",
  "Bolt",
  "Comet",
  "Rocket",
  "Zippy",
  "Gizmo",
  "Blitz",
  "Sprocket",
  "Echo",
  "Byte",
];

/** Stable display name for a bot id; the UI also tags it as a bot (BOT-04). */
export function botName(botId: string): string {
  const hash = hashString(botId);
  return `${BOT_NAMES[hash % BOT_NAMES.length]}-${((hash >>> 8) % 90) + 10}`;
}
