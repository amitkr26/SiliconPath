import Link from "next/link";
import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/data/opportunities";

export const dynamic = "force-dynamic";

export default async function OpportunityDetail({ params }: { params: { id: string } }) {
  const o = await getOpportunity(params.id);
  if (!o) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: o.title,
    hiringOrganization: { "@type": "Organization", name: o.organization },
    ...(o.location ? { jobLocation: { "@type": "Place", address: o.location } } : {}),
    ...(o.deadline ? { validThrough: o.deadline } : {}),
    description: o.description ?? o.title,
    ...(o.apply_link ? { url: o.apply_link } : {}),
  };

  return (
    <main className="detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/opportunities" style={{ fontSize: 14 }}>← All opportunities</Link>
      <h1>{o.title}</h1>
      <div className="org">{o.organization}</div>
      <dl>
        {o.category && (<><dt>Category</dt><dd>{o.category}</dd></>)}
        {o.location && (<><dt>Location</dt><dd>{o.location}</dd></>)}
        {o.deadline && (<><dt>Deadline</dt><dd>{o.deadline}</dd></>)}
        {o.stipend && (<><dt>Stipend</dt><dd>{o.stipend}</dd></>)}
        {o.eligibility && (<><dt>Eligibility</dt><dd>{o.eligibility}</dd></>)}
      </dl>
      {o.description && <p style={{ color: "var(--text-dim)", whiteSpace: "pre-wrap" }}>{o.description}</p>}
      <div>
        <a className="btn" href={o.apply_link ?? o.source_url} target="_blank" rel="noopener noreferrer">
          Apply / view source
        </a>
      </div>
    </main>
  );
}
