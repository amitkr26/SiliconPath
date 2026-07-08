import { redirect } from "next/navigation";
import { getThread, sendMessage } from "@/lib/data/messages";
import { getMyProfile } from "@/lib/data/profile";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: { userId: string } }) {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  let thread: Awaited<ReturnType<typeof getThread>> = [];
  let dbError: string | null = null;
  try {
    thread = await getThread(params.userId);
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
    console.error(dbError);
  }

  async function send(formData: FormData) {
    "use server";
    const body = String(formData.get("body") || "");
    if (body.trim()) await sendMessage(params.userId, body);
    redirect(`/messages/${params.userId}`);
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 22 }}>Messages</h1>
      {dbError ? (
        <p style={{ color: tokens.color.textMuted }}>Messages are temporarily unavailable.</p>
      ) : (
        <div style={{ display: "grid", gap: 8, margin: "12px 0" }}>
          {thread.length === 0 ? (
            <p style={{ color: tokens.color.textMuted }}>No messages yet. Say hello.</p>
          ) : (
            thread.map((m) => (
              <div
                key={m.id}
                style={{
                  justifySelf: m.sender_id === profile.id ? "end" : "start",
                  background: m.sender_id === profile.id ? tokens.color.accent : tokens.color.surface,
                  color: m.sender_id === profile.id ? "#04121A" : tokens.color.text,
                  padding: "8px 12px",
                  borderRadius: 10,
                  maxWidth: "75%",
                }}
              >
                {m.body}
              </div>
            ))
          )}
        </div>
      )}
      <form action={send} style={{ display: "flex", gap: 8 }}>
        <input name="body" placeholder="Write a message…" style={{ flex: 1, padding: "10px 12px", background: tokens.color.surfaceAlt, border: `1px solid ${tokens.color.border}`, borderRadius: 8, color: tokens.color.text }} />
        <button type="submit" style={{ padding: "10px 16px", background: tokens.color.accent, color: "#04121A", fontWeight: 600, border: 0, borderRadius: 8, cursor: "pointer" }}>Send</button>
      </form>
    </div>
  );
}
