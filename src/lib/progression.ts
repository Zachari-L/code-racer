/**
 * Driver progression and prestige leveling engine for CodeRacer
 */

export function calculateDriverLevel(totalRaces: number, totalWins: number): number {
  return Math.max(1, Math.floor((totalRaces + totalWins * 2) / 5) + 1);
}

export function getDriverTitle(level: number): string {
  if (level <= 2) return "Apprenti du Clavier";
  if (level <= 5) return "Pilote Vitesse";
  if (level <= 9) return "As de la Piste";
  if (level <= 14) return "Virtuose des Touches";
  return "Légende Vitesse Grand V";
}
