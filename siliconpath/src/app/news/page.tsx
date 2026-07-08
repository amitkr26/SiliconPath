import { listNews } from "@/lib/data/news";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const items = await listNews(40);
  return (
    <main>
      <section className="hero" style={{ padding: "36px 0 8px" }}>
        <h1 style={{ fontSize: 30 }}>Industry News</h1>
        <p>Semiconductor, VLSI & electronics — curated from trusted feeds</p>
      </section>
      {items.length === 0 ? (
        <p className="empty">No news yet.</p>
      ) : (
        <div className="grid">
          {items.map((n) => (
            <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer" className="card">
              <h3>{n.title}</h3>
              {n.source && <div className="org">{n.source}</div>}
              {n.summary && <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 8 }}>{n.summary.slice(0, 160)}…</p>}
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
