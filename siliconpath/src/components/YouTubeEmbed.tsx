import { tokens } from "@/lib/design/tokens";

/**
 * Official YouTube iframe embed ONLY — never downloaded/rehosted. Visible creator
 * attribution (name + channel link) is rendered next to every video, always
 * (guardrail #7). Attribution props are required, so a video cannot be shown
 * without crediting its creator.
 */
export function YouTubeEmbed({
  youtubeId,
  title,
  creatorName,
  creatorUrl,
}: {
  youtubeId: string;
  title: string;
  creatorName: string;
  creatorUrl: string;
}) {
  return (
    <figure style={{ margin: 0 }}>
      <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 10, overflow: "hidden" }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
          title={title}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
      <figcaption style={{ color: tokens.color.textMuted, fontSize: 13, marginTop: 6 }}>
        {title} · by{" "}
        <a href={creatorUrl} target="_blank" rel="noopener noreferrer" style={{ color: tokens.color.accent }}>
          {creatorName}
        </a>
      </figcaption>
    </figure>
  );
}
