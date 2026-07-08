import Link from "next/link";
import { listOpportunities, listCategories } from "@/lib/data/opportunities";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: { category?: string; location?: string; q?: string };
}) {
  const [items, categories] = await Promise.all([
    listOpportunities({ category: searchParams.category, location: searchParams.location, q: searchParams.q, limit: 60 }),
    listCategories().catch(() => []),
  ]);

  return (
    <main>
      <section className="hero" style={{ padding: "36px 0 8px" }}>
        <h1 style={{ fontSize: 30 }}>Opportunities</h1>
        <p>{items.length} live listings</p>
      </section>

      <form className="filters" method="get">
        <input name="q" placeholder="Search title, org, keyword…" defaultValue={searchParams.q ?? ""} />
        <select name="category" defaultValue={searchParams.category ?? ""}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input name="location" placeholder="Location" defaultValue={searchParams.location ?? ""} />
        <button className="btn" type="submit" style={{ marginTop: 0 }}>Filter</button>
      </form>

      {items.length === 0 ? (
        <p className="empty">No opportunities match. Try clearing filters.</p>
      ) : (
        <div className="grid">
          {items.map((o) => (
            <Link key={o.id} href={`/opportunities/${o.id}`} className="card">
              <h3>{o.title}</h3>
              <div className="org">{o.organization}</div>
              <div className="meta">
                {o.location && <span>📍 {o.location}</span>}
                {o.deadline && <span>⏰ {o.deadline}</span>}
                {o.stipend && <span>💰 {o.stipend}</span>}
              </div>
              <div style={{ marginTop: 10 }}>
                {o.tags?.slice(0, 3).map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
