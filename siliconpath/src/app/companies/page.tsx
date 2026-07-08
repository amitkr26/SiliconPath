import Link from "next/link";
import { listCompanies } from "@/lib/data/company";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  let companies: Awaited<ReturnType<typeof listCompanies>> = [];
  let dbError: string | null = null;
  try {
    companies = await listCompanies();
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
    console.error(dbError);
  }

  return (
    <div>
      <h1 style={{ fontFamily: tokens.font.display }}>Organizations</h1>
      <p style={{ color: tokens.color.textMuted, fontSize: 14 }}>
        Auto-generated from scraped opportunities. Representatives can claim a page to post jobs directly.
      </p>
      {dbError ? (
        <p style={{ color: tokens.color.textMuted }}>Directory is temporarily unavailable.</p>
      ) : companies.length === 0 ? (
        <p style={{ color: tokens.color.textMuted }}>No organizations yet — they appear as opportunities are scraped.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
          {companies.map((c) => (
            <Link key={c.id} href={`/companies/${c.id}`} style={{ padding: 14, background: tokens.color.surface, border: `1px solid ${tokens.color.border}`, borderRadius: 10, textDecoration: "none", color: tokens.color.text }}>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              {c.type && <div style={{ color: tokens.color.textMuted, fontSize: 13 }}>{c.type}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
