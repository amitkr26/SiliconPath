import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/data/opportunities";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

export default async function OpportunityDetail({ params }: { params: { id: string } }) {
  let opp;
  try {
    opp = await getOpportunity(params.id);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    throw e; // fail loud rather than render fake content
  }
  if (!opp) notFound();

  // JobPosting structured data for SEO/GEO (Google Jobs). Only fields we actually
  // have — nothing fabricated.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: opp.title,
    hiringOrganization: { "@type": "Organization", name: opp.organization },
    ...(opp.description ? { description: opp.description } : {}),
    ...(opp.location ? { jobLocation: { "@type": "Place", address: opp.location } } : {}),
    ...(opp.apply_link ? { url: opp.apply_link } : { url: opp.source_url }),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 26, marginBottom: 4 }}>{opp.title}</h1>
      <div style={{ color: tokens.color.accent, fontSize: 16 }}>{opp.organization}</div>

      <dl style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "8px 16px", margin: "20px 0" }}>
        {opp.location && <Row label="Location" value={opp.location} />}
        {opp.deadline && <Row label="Deadline" value={opp.deadline} />}
        {opp.stipend && <Row label="Stipend" value={opp.stipend} />}
        {opp.eligibility && <Row label="Eligibility" value={opp.eligibility} />}
        <Row label="Category" value={opp.category} />
      </dl>

      {opp.description && (
        <p style={{ whiteSpace: "pre-wrap", color: tokens.color.text, lineHeight: 1.6 }}>{opp.description}</p>
      )}

      <a
        href={opp.apply_link || opp.source_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          marginTop: 20,
          padding: "12px 20px",
          background: tokens.color.accent,
          color: "#04121A",
          borderRadius: 8,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Apply at source →
      </a>
      <p style={{ color: tokens.color.textMuted, fontSize: 12, marginTop: 8 }}>
        Source: <a href={opp.source_url} style={{ color: tokens.color.textMuted }}>{opp.source_url}</a>
      </p>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt style={{ color: tokens.color.textMuted }}>{label}</dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </>
  );
}
