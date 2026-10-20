import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Discord from "next-auth/providers/discord";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { findOrCreateOAuthUser } from "@/server/users";

/** Public handle of an OAuth profile (GitHub `login`, Discord `username`). */
function profileHandle(profile: unknown): string | undefined {
  if (typeof profile !== "object" || profile === null) return undefined;
  const { login, username } = profile as { login?: unknown; username?: unknown };
  if (typeof login === "string") return login;
  if (typeof username === "string") return username;
  return undefined;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    }),
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) return null;

        const { username, password } = validated.data;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user?.passwordHash) return null;

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordsMatch) return null;

        return { id: user.id, username: user.username, name: user.displayName ?? user.username };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      if (account && account.provider !== "credentials") {
        // OAuth: map the provider identity to our own user (created on first sign-in).
        const dbUser = await findOrCreateOAuthUser(
          account.provider,
          account.providerAccountId,
          profileHandle(profile)
        );
        token.id = dbUser.id;
        token.username = dbUser.username;
        token.name = dbUser.displayName ?? dbUser.username;
        // Never keep the provider's real name, e-mail or photo (protection of minors).
        token.email = null;
        token.picture = null;
      } else if (user?.id) {
        token.id = user.id;
        token.username = user.username;
      }

      if (trigger === "update" && token.id) {
        // The display name changed on the profile page (AUTH-05).
        const fresh = await prisma.user.findUnique({ where: { id: token.id } });
        if (fresh) token.name = fresh.displayName ?? fresh.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && token.username) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.name = token.name;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
