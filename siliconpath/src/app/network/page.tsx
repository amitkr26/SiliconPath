import { redirect } from "next/navigation";
import { listMyConnections } from "@/lib/data/network";
import { getMyProfile } from "@/lib/data/profile";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

export default async function NetworkPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  let connections: Awaited<ReturnType<typeof listMyConnections>> = [];
  let dbError: string | null = null;
  try {
    connections = await listMyConnections();
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
    console.error(dbError);
  }

  const accepted = connections.filter((c) => c.status === "accepted");
  const pending = connections.filter((c) => c.status === "pending");

  return (
    <div>
      <h1 style={{ fontFamily: tokens.font.display }}>Network</h1>
      {dbError ? (
        <p style={{ color: tokens.color.textMuted }}>Network is temporarily unavailable.</p>
      ) : (
        <>
          <p style={{ color: tokens.color.textMuted, fontSize: 14 }}>
            {accepted.length} connection{accepted.length === 1 ? "" : "s"} · {pending.length} pending
          </p>
          {connections.length === 0 && (
            <p style={{ color: tokens.color.textMuted }}>
              No connections yet. As people join, you'll be able to connect and message here.
            </p>
          )}
        </>
      )}
    </div>
  );
}
