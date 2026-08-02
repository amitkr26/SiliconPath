import { redirect } from "next/navigation";

// Public Access: /community maps directly to /news which is 100% open without login
export default function CommunityRedirect() {
  redirect("/news");
}
