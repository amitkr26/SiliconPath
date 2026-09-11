import { redirect } from "next/navigation";

// Consolidated: /match is now /network.
export default function MatchRedirect() {
  redirect("/network");
}
