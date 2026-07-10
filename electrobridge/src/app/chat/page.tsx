import { redirect } from "next/navigation";

// Consolidated: /chat is now /messages.
export default function ChatRedirect() {
  redirect("/messages");
}
