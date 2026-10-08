import { redirect } from "next/navigation";

export default function RaceDefaultPage() {
  // A race can only be accessed from a lobby (e.g. /race/[code])
  redirect("/lobby");
}
