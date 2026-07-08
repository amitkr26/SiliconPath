import { listNews } from "@/lib/data/news";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  let articles: Awaited<ReturnType<typeof listNews>> = [];
  let dbError: string | null = null;
  try {
    articles = await listNews(40);
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
    console.error(dbError);
  }

  return (
    <div>
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 28 }}>Industry News</h1>
      {dbError ? (
        <p style={{ color: tokens.color.textMuted }}>News is temporarily unavailable.</p>
      ) : articles.length === 0 ? (
        <p style={{ color: tokens.color.textMuted }}>No articles yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
          {articles.map((a) => (
            <li
              key={a.id}
              style={{
                padding: 14,
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: 8,
              }}
            >
              <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: tokens.color.text, textDecoration: "none", fontWeight: 600 }}>
                {a.title}
              </a>
              <div style={{ color: tokens.color.textMuted, fontSize: 12, marginTop: 4 }}>
                {[a.source, a.published_at ? new Date(a.published_at).toLocaleDateString() : null].filter(Boolean).join(" · ")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
