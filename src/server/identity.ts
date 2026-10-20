import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { GUEST_COOKIE, guestSessionSchema, type Identity } from "@/lib/identity";
import { getAuthSecret, verifyPayload } from "@/lib/signing";

/** Guest session from the signed cookie, if valid. */
export async function getGuestSession() {
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  return verifyPayload(token, getAuthSecret(), guestSessionSchema);
}

/** The signed-in user, else the guest, else `null`. */
export async function getCurrentIdentity(): Promise<Identity | null> {
  const session = await auth();
  if (session?.user?.id) {
    return {
      kind: "user",
      id: session.user.id,
      name: session.user.name ?? session.user.username,
    };
  }
  const guest = await getGuestSession();
  return guest ? { kind: "guest", id: guest.id, name: guest.nickname } : null;
}
