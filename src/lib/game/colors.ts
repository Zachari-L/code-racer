/**
 * Competitor colours from the artistic direction. Opponents cycle through
 * them; the local player is always drawn in electric lime, the colour
 * reserved for the player's own progress.
 */
export const PLAYER_COLORS = ["azure", "tangerine", "magenta", "teal"] as const;
export type PlayerColor = (typeof PLAYER_COLORS)[number];
export type CarColor = PlayerColor | "lime";

export function colorForIndex(index: number): PlayerColor {
  const size = PLAYER_COLORS.length;
  return PLAYER_COLORS[((index % size) + size) % size];
}
