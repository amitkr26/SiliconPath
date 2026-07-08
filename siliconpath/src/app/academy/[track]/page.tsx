import { notFound } from "next/navigation";
import { getTrack, listUnits, listVideosForUnits } from "@/lib/academy/data";
import { getUnlockedTrackIds } from "@/lib/academy/gating";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

export default async function TrackPage({ params }: { params: { track: string } }) {
  const track = await getTrack(params.track);
  if (!track) notFound();

  const unlocked = await getUnlockedTrackIds();
  if (!unlocked.has(track.id)) {
    return (
      <div>
        <h1 style={{ fontFamily: tokens.font.display }}>{track.title}</h1>
        <p style={{ color: tokens.color.textMuted }}>
          🔒 This track unlocks after you pass the previous track's checkpoint (≥ 70%).
        </p>
      </div>
    );
  }

  const units = await listUnits(track.id);
  const videos = await listVideosForUnits(units.map((u) => u.id));

  return (
    <div>
      <h1 style={{ fontFamily: tokens.font.display }}>{track.title}</h1>
      {track.summary && <p style={{ color: tokens.color.textMuted }}>{track.summary}</p>}

      {units.length === 0 ? (
        <p style={{ color: tokens.color.textMuted }}>Units for this track are being curated.</p>
      ) : (
        <div style={{ display: "grid", gap: 20, marginTop: 16 }}>
          {units.map((u) => (
            <section key={u.id} style={{ padding: 16, background: tokens.color.surface, border: `1px solid ${tokens.color.border}`, borderRadius: 10 }}>
              <h2 style={{ fontFamily: tokens.font.display, fontSize: 18 }}>Day {u.day_number}: {u.title}</h2>
              {u.theory_md && <p style={{ color: tokens.color.text, whiteSpace: "pre-wrap" }}>{u.theory_md}</p>}
              {(videos[u.id] ?? []).map((v) => (
                <div key={v.id} style={{ marginTop: 12 }}>
                  <YouTubeEmbed youtubeId={v.youtube_id} title={v.title} creatorName={v.creator_name} creatorUrl={v.creator_url} />
                </div>
              ))}
              {u.lab_md && (
                <div style={{ marginTop: 12 }}>
                  <h3 style={{ fontSize: 14, color: tokens.color.accent }}>Lab task</h3>
                  <p style={{ whiteSpace: "pre-wrap", color: tokens.color.text }}>{u.lab_md}</p>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
