import { redirect } from "next/navigation";
import { listOpportunities } from "@/lib/data/opportunities";
import { listNews } from "@/lib/data/news";
import { getMyProfile } from "@/lib/data/profile";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

// Curated feed: opportunity/news based, NOT a blank user-generated status wall
// (spec §8). Avoids the empty-UGC-feed failure mode.
export default async function FeedPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  let items: { kind: "opp" | "news"; id: string; title: string; sub: string; href: string }[] = [];
  let dbError: string | null = null;
  try {
    const [{ rows }, news] = await Promise.all([listOpportunities({ limit: 10 }), listNews(10)]);
    items = [
      ...rows.map((o) => ({ kind: "opp" as const, id: o.id, title: o.title, sub: o.organization, href: `/opportunities/${o.id}` })),
      ...news.map((n) => ({ kind: "news" as const, id: n.id, title: n.title, sub: n.source ?? "News", href: n.url })),
    ];
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
    console.error(dbError);
  }

  return (
    <div>
      <h1 style={{ fontFamily: tokens.font.display }}>Your feed</h1>
      {dbError ? (
        <p style={{ color: tokens.color.textMuted }}>Feed is temporarily unavailable.</p>
      ) : items.length === 0 ? (
        <p style={{ color: tokens.color.textMuted }}>Nothing yet — new opportunities and news will show up here.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
          {items.map((it) => (
            <li key={`${it.kind}-${it.id}`} style={{ padding: 14, background: tokens.color.surface, border: `1px solid ${tokens.color.border}`, borderRadius: 10 }}>
              <a href={it.href} style={{ color: tokens.color.text, textDecoration: "none", fontWeight: 600 }}>{it.title}</a>
              <div style={{ color: tokens.color.textMuted, fontSize: 13 }}>{it.kind === "opp" ? "Opportunity" : "News"} · {it.sub}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
