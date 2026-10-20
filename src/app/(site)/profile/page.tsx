import { ProfileView } from "@/components/profile/ProfileView";
import { getUserProfile } from "@/server/actions/profile";

export const dynamic = "force-dynamic";

export default async function ProfileDefaultPage() {
  const profileResult = await getUserProfile();

  return <ProfileView initialProfileResult={profileResult} />;
}
