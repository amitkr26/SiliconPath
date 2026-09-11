import { redirect } from "next/navigation";

// Consolidated: /people is now /network.
export default function PeopleRedirect() {
  redirect("/network");
}
