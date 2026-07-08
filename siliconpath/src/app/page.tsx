import Link from "next/link";
import { listCategoriesWithCounts } from "@/lib/data/opportunities";
import { CATEGORIES } from "@/lib/types";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let counts: Record<string, number> = {};
  let dbError: string | null = null;
  try {
    counts = await listCategoriesWithCounts();
  } catch (e) {
    // Fail loud in logs; show an honest empty state to the user (no fake data).
    dbError = e instanceof Error ? e.message : String(e);
    console.error(dbError);
  }

  return (
    <div>
      <section style={{ padding: "32px 0 48px" }}>
        <h1 style={{ fontFamily: tokens.font.display, fontSize: 40, margin: 0, lineHeight: 1.1 }}>
          Every semiconductor & VLSI opportunity, <span style={{ color: tokens.color.accent }}>one place</span>.
        </h1>
        <p style={{ color: tokens.color.textMuted, fontSize: 18, maxWidth: 640 }}>
          JRFs, PhDs, PSU scientist roles, and private VLSI jobs — aggregated from official sources. No login. No paywall.
        </p>
        <Link
          href="/opportunities"
          style={{
            display: "inline-block",
            marginTop: 12,
            padding: "12px 20px",
            background: tokens.color.accent,
            color: "#04121A",
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Browse opportunities
        </Link>
      </section>

      <section>
        <h2 style={{ fontFamily: tokens.font.display, fontSize: 22 }}>Categories</h2>
        {dbError ? (
          <p style={{ color: tokens.color.textMuted }}>
            Opportunities are temporarily unavailable. (No data is being shown rather than placeholder data.)
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={`/opportunities?category=${c.value}`}
                style={{
                  padding: 16,
                  background: tokens.color.surface,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: 10,
                  textDecoration: "none",
                  color: tokens.color.text,
                }}
              >
                <div style={{ fontWeight: 600 }}>{c.label}</div>
                <div style={{ color: tokens.color.textMuted, fontSize: 13 }}>{counts[c.value] ?? 0} open</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
