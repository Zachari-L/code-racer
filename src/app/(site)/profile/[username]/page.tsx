import { ProfileView } from "@/components/profile/ProfileView";
import { getUserProfile } from "@/server/actions/profile";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfileUsernamePage({ params }: PageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const profileResult = await getUserProfile(decodedUsername);

  return <ProfileView initialUsername={decodedUsername} initialProfileResult={profileResult} />;
}
