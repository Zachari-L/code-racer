/** Usernames: 3 to 20 letters, digits, `_` or `-` (same rule as registration). */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,20}$/;

/**
 * Turns a provider handle (GitHub login, Discord username) into a valid
 * username. Only the public handle is used: real names and e-mails are never
 * stored, to protect minors.
 */
export function toUsernameCandidate(handle: string | null | undefined): string {
  const cleaned = (handle ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 20);
  return cleaned.length >= 3 ? cleaned : `racer${cleaned}`.slice(0, 20);
}

/** Candidate with a numeric suffix that still fits in 20 characters. */
export function withSuffix(base: string, suffix: number): string {
  const tail = String(suffix);
  return `${base.slice(0, 20 - tail.length)}${tail}`;
}
