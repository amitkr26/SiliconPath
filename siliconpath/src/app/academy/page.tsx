import Link from "next/link";
import { listTracks } from "@/lib/academy/data";
import { getUnlockedTrackIds } from "@/lib/academy/gating";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

export default async function AcademyPage() {
  let tracks: Awaited<ReturnType<typeof listTracks>> = [];
  let unlocked = new Set<string>();
  let dbError: string | null = null;
  try {
    tracks = await listTracks();
    unlocked = await getUnlockedTrackIds();
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
    console.error(dbError);
  }

  return (
    <div>
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 28 }}>VLSI Academy</h1>
      <p style={{ color: tokens.color.textMuted }}>
        Free, structured tracks built from curated, creator-attributed content. Each track unlocks after you pass the previous checkpoint.
      </p>

      {dbError ? (
        <p style={{ color: tokens.color.textMuted }}>Academy is temporarily unavailable.</p>
      ) : tracks.length === 0 ? (
        <p style={{ color: tokens.color.textMuted }}>
          Curriculum is being curated and will appear here once content passes verification. (No placeholder content is shown.)
        </p>
      ) : (
        <ol style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
          {tracks.map((t) => {
            const isUnlocked = unlocked.has(t.id);
            return (
              <li key={t.id}>
                <div
                  style={{
                    padding: 16,
                    background: tokens.color.surface,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: 10,
                    opacity: isUnlocked ? 1 : 0.55,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 600 }}>{t.ordinal}. {t.title}</div>
                    {isUnlocked ? (
                      <Link href={`/academy/${t.id}`} style={{ color: tokens.color.accent }}>Open →</Link>
                    ) : (
                      <span style={{ color: tokens.color.textMuted, fontSize: 13 }}>🔒 Locked</span>
                    )}
                  </div>
                  {t.summary && <p style={{ color: tokens.color.textMuted, fontSize: 14, margin: "6px 0 0" }}>{t.summary}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
