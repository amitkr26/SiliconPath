import { redirect } from "next/navigation";

// Consolidated: /community is now /feed.
export default function CommunityRedirect() {
  redirect("/feed");
}
