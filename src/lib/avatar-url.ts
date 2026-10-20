/** Public URL of an uploaded avatar; the version busts caches after a new upload. */
export function avatarUrlFor(userId: string, updatedAt: Date): string {
  return `/api/avatars/${userId}?v=${updatedAt.getTime()}`;
}
