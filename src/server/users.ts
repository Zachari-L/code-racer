import { prisma } from "@/lib/prisma";
import { toUsernameCandidate, withSuffix } from "@/lib/username";

/**
 * Finds the user linked to an OAuth identity, creating it on first sign-in
 * with a unique username derived from the provider handle.
 */
export async function findOrCreateOAuthUser(
  provider: string,
  providerAccountId: string,
  handle: string | null | undefined
) {
  const account = await prisma.account.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    include: { user: true },
  });
  if (account) return account.user;

  const base = toUsernameCandidate(handle);
  for (let attempt = 0; attempt < 50; attempt++) {
    const username = attempt === 0 ? base : withSuffix(base, attempt + 1);
    const taken = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (taken) continue;
    return prisma.user.create({
      data: { username, accounts: { create: { provider, providerAccountId } } },
    });
  }
  throw new Error("Could not find a free username");
}
