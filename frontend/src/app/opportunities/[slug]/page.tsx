import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Currency, Calendar, ExternalLink, Clock, Briefcase, GraduationCap, CalendarDays, User, Bookmark, Share2, BookmarkCheck } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { formatDate, isExpired, mapDbOpportunityToClient } from "@/lib/utils";
import CategoryBadge from "@/components/CategoryBadge";
import DeadlineCountdown from "@/components/DeadlineCountdown";
import ApplyButton from "@/components/ApplyButton";
import ShareButtons from "@/components/ShareButtons";
import SimilarOpportunities from "@/components/SimilarOpportunities";
import CopyLinkButton from "@/components/CopyLinkButton";
import VerificationBadge from "@/components/VerificationBadge";
import LinkTypeIndicator from "@/components/LinkTypeIndicator";
import OpportunityDisclaimer from "@/components/OpportunityDisclaimer";
import AIOpportunitySummary from "@/components/AIOpportunitySummary";
import OpenToWorkBanner from "@/components/OpenToWorkBanner";

export const revalidate = 3600;

export async function generateStaticParams() {
  if (!supabaseAdmin?.from) return [];
  const { data } = await supabaseAdmin
    .from("opportunities")
    .select("slug")
    .eq("is_active", true)
    .not("slug", "is", null)
    .limit(100);
  return (data || [])
    .filter((opp: { slug: string }) => opp.slug.length <= 80)
    .map((opp: { slug: string }) => ({ slug: opp.slug }));
}

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  if (!supabaseAdmin?.from) return { title: "Opportunity | BerojgarDegreeWala" };

  const { data: rawOpportunity } = await supabaseAdmin
    .from("opportunities")
    .select("*, organizations(*)")
    .eq("slug", params.slug)
    .single();

  if (!rawOpportunity) return { title: "Opportunity Not Found" };
  const opportunity = mapDbOpportunityToClient(rawOpportunity);

  const deadlineStr = opportunity.deadline
    ? new Date(opportunity.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "Check website";

  return {
    title: `${opportunity.title} — ${opportunity.organization}`,
    description: `${opportunity.category} position at ${opportunity.organization}${opportunity.location ? ` in ${opportunity.location}` : ""}.${opportunity.eligibility ? ` Eligibility: ${opportunity.eligibility}.` : ""}${opportunity.stipend ? ` Stipend: ${opportunity.stipend}.` : ""} Apply by ${deadlineStr}.`,
    keywords: [...(opportunity.tags || []), opportunity.organization, opportunity.category, opportunity.location, "BerojgarDegreeWala"].filter(Boolean),
    openGraph: {
      title: `${opportunity.title} | ${opportunity.organization}`,
      description: `${opportunity.category} • ${opportunity.location || "India"} • Deadline: ${deadlineStr} • ${opportunity.eligibility || ""}`,
      url: `https://berojgardegreewala.vercel.app/opportunities/${params.slug}`,
      images: [{ url: `https://berojgardegreewala.vercel.app/api/og/opportunity/${params.slug}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${opportunity.title} | ${opportunity.organization}`,
      images: [`https://berojgardegreewala.vercel.app/api/og/opportunity/${params.slug}`],
    },
    alternates: { canonical: `https://berojgardegreewala.vercel.app/opportunities/${params.slug}` },
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export default async function OpportunityDetailPage({ params }: Props) {
  if (!supabaseAdmin?.from) notFound();

  const { data: rawOpportunity, error } = await supabaseAdmin
    .from("opportunities")
    .select("*, organizations(*)")
    .eq("slug", params.slug)
    .single();

  if (error || !rawOpportunity) notFound();
  const opportunity = mapDbOpportunityToClient(rawOpportunity);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: opportunity.title,
    description: opportunity.description,
    hiringOrganization: {
      "@type": "Organization",
      name: opportunity.organization,
      sameAs: opportunity.official_page_url || opportunity.apply_link,
    },
    jobLocation: opportunity.location
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: opportunity.location,
            addressCountry: opportunity.location && opportunity.location.match(/India|Delhi|Bangalore|Mumbai/i) ? "IN" : opportunity.location === "Germany" ? "DE" : "SG",
          },
        }
      : undefined,
    employmentType: opportunity.category === "Private Job" ? "FULL_TIME" : opportunity.category === "JRF" || opportunity.category === "SRF" ? "CONTRACTOR" : undefined,
    validThrough: opportunity.deadline,
    baseSalary: opportunity.stipend
      ? {
          "@type": "MonetaryAmount",
          currency: opportunity.location === "Germany" ? "EUR" : opportunity.location === "Singapore" ? "SGD" : "INR",
          value: { "@type": "QuantitativeValue", value: opportunity.stipend },
        }
      : undefined,
    datePosted: opportunity.posted_at,
    url: `https://berojgardegreewala.vercel.app/opportunities/${opportunity.slug}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://berojgardegreewala.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Opportunities", item: "https://berojgardegreewala.vercel.app/opportunities" },
      { "@type": "ListItem", position: 3, name: opportunity.title, item: `https://berojgardegreewala.vercel.app/opportunities/${opportunity.slug}` },
    ],
  };

  const orgType = (opportunity.organization || "").match(/ISRO|DRDO|CSIR|IIT|NIT|Govt/i)
    ? "Government"
    : (opportunity.organization || "").match(/TI|Texas|Intel|Qualcomm|Samsung|IBM/i)
    ? "Private"
    : "Research";

  const eligibilityItems = opportunity.eligibility
    ? opportunity.eligibility.split("\n").flatMap((line: string) => line.split(/[;,]/)).map((s: string) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="flex gap-8">
        {/* Left Column */}
        <div className="flex-1 min-w-0">
          {/* Back link */}
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Opportunities
          </Link>

          {/* Expired banner */}
          {opportunity.deadline && isExpired(opportunity.deadline) && (
            <div className="bg-danger/15 border border-danger/25 rounded-lg p-3 mb-4 text-center">
              <p className="text-danger text-sm font-medium">
                This opportunity has expired. The deadline was {formatDate(opportunity.deadline)}.
              </p>
            </div>
          )}

          {/* Unverified banner */}
          {opportunity.verification_status === "unverified" && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
              <p className="text-warning text-xs">
                ⚠️ This opportunity was auto-scraped and is pending manual verification. Always confirm details on the official website before applying.
              </p>
            </div>
          )}

          {/* Link unavailable banner */}
          {opportunity.verification_status === "link_unavailable" && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 mb-4">
              <p className="text-danger text-xs">
                ⚠️ The apply link appears to be temporarily unavailable. Use the official website link below to find this opportunity.
              </p>
            </div>
          )}

          {/* HEADER CARD */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-accent text-sm font-bold">{getInitials(opportunity.organization)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary">{opportunity.title}</h1>
                <p className="text-text-secondary text-sm mt-0.5">{opportunity.organization}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <CategoryBadge category={opportunity.category} />
                  {opportunity.verification_status && <VerificationBadge status={opportunity.verification_status} />}
                  {opportunity.deadline && <DeadlineCountdown deadline={opportunity.deadline} />}
                </div>
              </div>
            </div>

            {/* Deadline progress bar */}
            {opportunity.deadline && (
              <div className="mt-4">
                <DeadlineCountdown deadline={opportunity.deadline} variant="progress" />
              </div>
            )}

            {/* Link type indicator */}
            {opportunity.apply_link_type && (
              <div className="mt-4">
                <LinkTypeIndicator type={opportunity.apply_link_type} />
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          {opportunity.description && (
            <div className="mt-6">
              <div className="flex items-start gap-3">
                <div className="w-1 h-8 bg-accent rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold text-text-primary mb-2">Description</h2>
                  <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{opportunity.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* ELIGIBILITY */}
          {eligibilityItems.length > 0 && (
            <div className="mt-6">
              <div className="flex items-start gap-3">
                <div className="w-1 h-8 bg-accent rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold text-text-primary mb-2">Eligibility</h2>
                  <ul className="space-y-2">
                    {eligibilityItems.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-text-secondary text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* QUICK FACTS */}
          <div className="mt-6 p-4 bg-surface border border-border rounded-lg">
            <h3 className="font-display text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-accent" />
              Quick Facts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-text-muted">Position Type</span>
                <p className="text-text-primary font-medium">{opportunity.category}</p>
              </div>
              <div>
                <span className="text-text-muted">Organization Type</span>
                <p className="text-text-primary font-medium">{orgType}</p>
              </div>
              <div>
                <span className="text-text-muted">Work Location</span>
                <p className="text-text-primary font-medium">{opportunity.location || "On-site"}</p>
              </div>
              {opportunity.eligibility?.match(/NET|GATE/i) && (
                <div>
                  <span className="text-text-muted">NET/GATE Required</span>
                  <p className="text-success font-medium">Yes</p>
                </div>
              )}
              {opportunity.stipend && (
                <div>
                  <span className="text-text-muted">Compensation / Stipend</span>
                  <p className="text-text-primary font-medium">{opportunity.stipend}</p>
                </div>
              )}
              {opportunity.duration && (
                <div>
                  <span className="text-text-muted">Duration</span>
                  <p className="text-text-primary font-medium">{opportunity.duration}</p>
                </div>
              )}
              {opportunity.experience_required && (
                <div>
                  <span className="text-text-muted">Experience</span>
                  <p className="text-text-primary font-medium">{opportunity.experience_required}</p>
                </div>
              )}
              {opportunity.min_qualification && (
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-text-muted">Min Qualification</span>
                  <p className="text-text-primary font-medium truncate" title={opportunity.min_qualification}>{opportunity.min_qualification}</p>
                </div>
              )}
            </div>
          </div>

          {/* RESPONSIBILITIES */}
          {opportunity.responsibilities && Array.isArray(opportunity.responsibilities) && opportunity.responsibilities.length > 0 && (
            <div className="mt-6">
              <div className="flex items-start gap-3">
                <div className="w-1 h-8 bg-accent rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold text-text-primary mb-2">Key Responsibilities</h2>
                  <ul className="space-y-2">
                    {opportunity.responsibilities.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-text-secondary text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/80 flex-shrink-0 mt-1.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* REQUIREMENTS */}
          {opportunity.requirements && Array.isArray(opportunity.requirements) && opportunity.requirements.length > 0 && (
            <div className="mt-6">
              <div className="flex items-start gap-3">
                <div className="w-1 h-8 bg-accent rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold text-text-primary mb-2">Specific Requirements</h2>
                  <ul className="space-y-2">
                    {opportunity.requirements.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-text-secondary text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/80 flex-shrink-0 mt-1.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SKILLS REQUIRED */}
          {opportunity.skills_required && Array.isArray(opportunity.skills_required) && opportunity.skills_required.length > 0 && (
            <div className="mt-6">
              <div className="flex items-start gap-3">
                <div className="w-1 h-8 bg-accent rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold text-text-primary mb-2">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.skills_required.map((skill: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-surface-elevated border border-border rounded-md text-text-secondary text-xs font-medium shadow-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {opportunity.tags && opportunity.tags.length > 0 && (
            <div className="mt-6">
              <h2 className="font-display text-sm font-bold text-text-primary mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {opportunity.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/opportunities?search=${tag}`}
                    className="px-3 py-1 bg-surface border border-border rounded-full text-text-secondary text-xs hover:border-accent/50 hover:text-accent transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 hidden lg:block flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            {/* Apply Now */}
            {opportunity.apply_link && (
              <ApplyButton
                applyLink={opportunity.apply_link}
                opportunityId={opportunity.id!}
                verificationStatus={opportunity.verification_status}
                officialPageUrl={opportunity.official_page_url}
              />
            )}

            {/* Official Organization Website link */}
            <a
              href={opportunity.official_page_url || opportunity.apply_link || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-accent/40 text-accent bg-accent/5 font-semibold rounded-lg px-4 py-3 text-sm hover:bg-accent hover:text-bg-primary transition-all w-full shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Visit Official Organization Website
            </a>

            {/* Save + Share */}
            <div className="flex gap-2">
              <button className="flex-1 inline-flex items-center justify-center gap-2 border border-border text-text-primary font-medium rounded-lg px-4 py-2.5 text-sm hover:border-accent/50 transition-colors">
                <Bookmark className="w-4 h-4" /> Save
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 border border-border text-text-primary font-medium rounded-lg px-4 py-2.5 text-sm hover:border-accent/50 transition-colors">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            {/* Open to Work banner */}
            <OpenToWorkBanner />

            {/* Quick Facts Card */}
            <div className="bg-surface-elevated border border-border rounded-xl p-4">
              <h3 className="font-display text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Quick Facts</h3>
              <div className="space-y-2.5">
                {opportunity.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-xs">Location</span>
                    <span className="text-text-primary text-sm font-medium">{opportunity.location}</span>
                  </div>
                )}
                {opportunity.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-xs">Type</span>
                    <span className="text-text-primary text-sm font-medium">{opportunity.category}</span>
                  </div>
                )}
                {opportunity.deadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-xs">Deadline</span>
                    <span className="text-text-primary text-sm font-medium">{formatDate(opportunity.deadline)}</span>
                  </div>
                )}
                {opportunity.stipend && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-xs">Stipend</span>
                    <span className="text-text-primary text-sm font-medium">{opportunity.stipend}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-xs">Org. Type</span>
                  <span className="text-text-primary text-sm font-medium">{orgType}</span>
                </div>
              </div>
            </div>

            {/* Calendar export */}
            {opportunity.id && (
              <a
                href={`/api/calendar-export/${opportunity.id}`}
                className="inline-flex items-center justify-center gap-2 border border-border text-text-primary font-medium rounded-lg px-4 py-2.5 text-sm hover:border-accent/50 transition-colors w-full"
                download
              >
                <Calendar className="w-4 h-4" />
                Add to Calendar
              </a>
            )}

            {/* Share + Copy */}
            <ShareButtons
              title={opportunity.title}
              organization={opportunity.organization}
              deadline={opportunity.deadline}
              opportunityUrl={`https://berojgardegreewala.vercel.app/opportunities/${opportunity.slug}`}
            />
            <CopyLinkButton url={`https://berojgardegreewala.vercel.app/opportunities/${opportunity.slug}`} />
          </div>
        </div>
      </div>

      {/* Mobile Save/Share/Quick Facts (visible below lg) */}
      <div className="lg:hidden mt-6 space-y-4">
        {opportunity.apply_link && (
          <ApplyButton
            applyLink={opportunity.apply_link}
            opportunityId={opportunity.id!}
            verificationStatus={opportunity.verification_status}
            officialPageUrl={opportunity.official_page_url}
          />
        )}
        {opportunity.official_page_url && opportunity.apply_link !== opportunity.official_page_url && (
          <a
            href={opportunity.official_page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-border text-text-primary font-medium rounded-lg px-4 py-2.5 text-sm hover:border-accent/50 transition-colors w-full"
          >
            <ExternalLink className="w-4 h-4" />
            Official Website
          </a>
        )}
        <div className="flex gap-2">
          <span className="flex-1 inline-flex items-center justify-center gap-2 border border-border text-text-primary font-medium rounded-lg px-4 py-2.5 text-sm">
            <Bookmark className="w-4 h-4" /> Save
          </span>
          <span className="flex-1 inline-flex items-center justify-center gap-2 border border-border text-text-primary font-medium rounded-lg px-4 py-2.5 text-sm">
            <Share2 className="w-4 h-4" /> Share
          </span>
        </div>
        <div className="bg-surface-elevated border border-border rounded-xl p-4">
          <h3 className="font-display text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Quick Facts</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {opportunity.location && (
              <div><span className="text-text-muted">Location</span><p className="text-text-primary font-medium">{opportunity.location}</p></div>
            )}
            {opportunity.category && (
              <div><span className="text-text-muted">Type</span><p className="text-text-primary font-medium">{opportunity.category}</p></div>
            )}
            {opportunity.deadline && (
              <div><span className="text-text-muted">Deadline</span><p className="text-text-primary font-medium">{formatDate(opportunity.deadline)}</p></div>
            )}
            {opportunity.stipend && (
              <div><span className="text-text-muted">Stipend</span><p className="text-text-primary font-medium">{opportunity.stipend}</p></div>
            )}
            <div><span className="text-text-muted">Org. Type</span><p className="text-text-primary font-medium">{orgType}</p></div>
          </div>
        </div>
        {opportunity.id && (
          <a
            href={`/api/calendar-export/${opportunity.id}`}
            className="inline-flex items-center justify-center gap-2 border border-border text-text-primary font-medium rounded-lg px-4 py-2.5 text-sm hover:border-accent/50 transition-colors w-full"
            download
          >
            <Calendar className="w-4 h-4" />
            Add to Calendar
          </a>
        )}
        <ShareButtons
          title={opportunity.title}
          organization={opportunity.organization}
          deadline={opportunity.deadline}
          opportunityUrl={`https://berojgardegreewala.vercel.app/opportunities/${opportunity.slug}`}
        />
        <CopyLinkButton url={`https://berojgardegreewala.vercel.app/opportunities/${opportunity.slug}`} />
      </div>

      {/* AI Summary */}
      <div className="mt-8">
        <AIOpportunitySummary slug={params.slug} />
      </div>

      {/* Disclaimer */}
      <div className="mt-6">
        <OpportunityDisclaimer
          opportunityId={opportunity.id!}
          officialPageUrl={opportunity.official_page_url}
        />
      </div>

      <SimilarOpportunities
        currentId={opportunity.id}
        tags={opportunity.tags || []}
      />
    </div>
  );
}
