import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, IndianRupee, Calendar, Clock, Building2 } from "lucide-react";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import type { Opportunity } from "@/types";
import CategoryBadge from "@/components/CategoryBadge";
import VerificationBadge from "@/components/VerificationBadge";
import DeadlineCountdown from "@/components/DeadlineCountdown";
import ApplyButton from "@/components/ApplyButton";
import ShareButtons from "@/components/ShareButtons";
import CopyLinkButton from "@/components/CopyLinkButton";
import OpportunityDisclaimer from "@/components/OpportunityDisclaimer";
import SimilarOpportunities from "@/components/SimilarOpportunities";

async function getOpportunity(slug: string): Promise<Opportunity | null> {
  if (!isAdminConfigured) return null;
  const { data } = await supabaseAdmin
    .from("opportunities")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!data) return null;
  return mapDbOpportunityToClient(data);
}

export default async function OpportunityDetailPage({ params }: { params: { slug: string } }) {
  const opportunity = await getOpportunity(params.slug);
  if (!opportunity) notFound();

  const url = `https://siliconpath.vercel.app/opportunities/${opportunity.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: opportunity.title,
    hiringOrganization: { "@type": "Organization", name: opportunity.organization },
    ...(opportunity.location ? { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: opportunity.location } } } : {}),
    ...(opportunity.deadline ? { validThrough: opportunity.deadline } : {}),
    description: opportunity.description || opportunity.title,
    ...(opportunity.apply_link ? { url: opportunity.apply_link } : {}),
    ...(opportunity.stipend ? { baseSalary: { "@type": "MonetaryAmount", value: opportunity.stipend } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="glass-premium rounded-xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <CategoryBadge category={opportunity.category} />
            {opportunity.verification_status && <VerificationBadge status={opportunity.verification_status} />}
            {(opportunity as any).source_type === "scraped" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted">Aggregated</span>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary leading-tight mb-4">
            {opportunity.title}
          </h1>

          <div className="flex items-center gap-2 text-text-secondary mb-6">
            <Building2 className="w-4 h-4" />
            <span className="font-medium">{opportunity.organization}</span>
            {opportunity.org_slug && (
              <Link href={`/companies/${opportunity.org_slug}`} className="text-accent text-sm hover:underline">
                View company →
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-text-muted mb-6">
            {opportunity.location && (
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {opportunity.location}</span>
            )}
            {opportunity.stipend && (
              <span className="flex items-center gap-1.5"><IndianRupee className="w-4 h-4" /> {opportunity.stipend}</span>
            )}
            {opportunity.deadline && (
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Deadline: {new Date(opportunity.deadline).toLocaleDateString()}</span>
            )}
            {opportunity.posted_at && (
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Posted {new Date(opportunity.posted_at).toLocaleDateString()}</span>
            )}
          </div>

          {opportunity.deadline && <DeadlineCountdown deadline={opportunity.deadline} />}

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <ApplyButton
              applyLink={opportunity.apply_link || opportunity.source_url || ""}
              opportunityId={opportunity.id || ""}
              verificationStatus={opportunity.verification_status}
              officialPageUrl={opportunity.official_page_url}
            />
            <ShareButtons
              title={opportunity.title}
              organization={opportunity.organization}
              deadline={opportunity.deadline}
              opportunityUrl={url}
            />
            <CopyLinkButton url={url} />
            {opportunity.deadline && (
              <a
                href={`/api/calendar-export/${opportunity.id}`}
                className="inline-flex items-center gap-2 text-text-secondary hover:text-accent text-sm font-medium transition-colors"
              >
                <Calendar className="w-4 h-4" /> Add to Calendar
              </a>
            )}
          </div>

          {opportunity.source_url && (
            <p className="mt-4 text-[11px] text-text-muted">
              Source: <a href={opportunity.source_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all">{opportunity.source_url}</a>
            </p>
          )}
        </div>

        {/* Eligibility */}
        {opportunity.eligibility && (
          <div className="bg-surface border border-border rounded-xl p-6 mt-4">
            <h2 className="font-display text-lg font-bold text-text-primary mb-3">Eligibility</h2>
            <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">{opportunity.eligibility}</p>
          </div>
        )}

        {/* Description */}
        {opportunity.description && (
          <div className="bg-surface border border-border rounded-xl p-6 mt-4">
            <h2 className="font-display text-lg font-bold text-text-primary mb-3">Details</h2>
            <div className="prose prose-sm max-w-none prose-invert">
              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">{opportunity.description}</p>
            </div>
          </div>
        )}

        {/* Tags */}
        {opportunity.tags && opportunity.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {opportunity.tags.map((t) => (
              <span key={t} className="text-[11px] bg-accent/10 text-accent px-2.5 py-1 rounded-full">{t}</span>
            ))}
          </div>
        )}

        <div className="mt-4">
          <OpportunityDisclaimer opportunityId={opportunity.id || ""} officialPageUrl={opportunity.official_page_url} />
        </div>

        <SimilarOpportunities currentId={opportunity.id || ""} tags={opportunity.tags || []} />
      </div>
    </>
  );
}
