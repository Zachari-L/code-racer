import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    role?: string;
  }
}

export interface AuthUser {
  id: string;
  username: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
}
