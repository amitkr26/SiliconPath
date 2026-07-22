import { redirect } from "next/navigation";

// Consolidated: /community is now the /feed.
export default function CommunityRedirect() {
  redirect("/feed");
}
