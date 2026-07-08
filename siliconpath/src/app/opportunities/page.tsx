import Link from "next/link";
import { listOpportunities } from "@/lib/data/opportunities";
import { CATEGORIES } from "@/lib/types";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

interface SearchParams {
  category?: string;
  location?: string;
  q?: string;
  page?: string;
}

export default async function OpportunitiesPage({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const limit = 24;

  let rows: Awaited<ReturnType<typeof listOpportunities>>["rows"] = [];
  let total = 0;
  let dbError: string | null = null;
  try {
    const res = await listOpportunities({
      category: searchParams.category,
      location: searchParams.location,
      search: searchParams.q,
      limit,
      offset: (page - 1) * limit,
    });
    rows = res.rows;
    total = res.total;
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
    console.error(dbError);
  }

  return (
    <div>
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 28 }}>Opportunities</h1>

      <form method="get" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0" }}>
        <input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Search title, org, keywords…"
          style={inputStyle}
        />
        <select name="category" defaultValue={searchParams.category ?? ""} style={inputStyle}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input name="location" defaultValue={searchParams.location ?? ""} placeholder="Location" style={inputStyle} />
        <button type="submit" style={{ ...inputStyle, background: tokens.color.accent, color: "#04121A", fontWeight: 600, cursor: "pointer" }}>
          Filter
        </button>
      </form>

      {dbError ? (
        <p style={{ color: tokens.color.textMuted }}>Opportunities are temporarily unavailable.</p>
      ) : rows.length === 0 ? (
        <p style={{ color: tokens.color.textMuted }}>No opportunities match these filters.</p>
      ) : (
        <>
          <p style={{ color: tokens.color.textMuted, fontSize: 13 }}>{total} result{total === 1 ? "" : "s"}</p>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
            {rows.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/opportunities/${o.id}`}
                  style={{
                    display: "block",
                    padding: 16,
                    background: tokens.color.surface,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: 10,
                    textDecoration: "none",
                    color: tokens.color.text,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{o.title}</div>
                  <div style={{ color: tokens.color.accent, fontSize: 14 }}>{o.organization}</div>
                  <div style={{ color: tokens.color.textMuted, fontSize: 13, marginTop: 4 }}>
                    {[o.location, o.deadline ? `Deadline: ${o.deadline}` : null].filter(Boolean).join(" · ")}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            {page > 1 && (
              <Link href={buildPageHref(searchParams, page - 1)} style={pagerStyle}>
                ← Prev
              </Link>
            )}
            {page * limit < total && (
              <Link href={buildPageHref(searchParams, page + 1)} style={pagerStyle}>
                Next →
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function buildPageHref(sp: SearchParams, page: number): string {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.category) params.set("category", sp.category);
  if (sp.location) params.set("location", sp.location);
  params.set("page", String(page));
  return `/opportunities?${params.toString()}`;
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  background: tokens.color.surfaceAlt,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: 8,
  color: tokens.color.text,
};
const pagerStyle: React.CSSProperties = {
  padding: "8px 14px",
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: 8,
  color: tokens.color.text,
  textDecoration: "none",
};
