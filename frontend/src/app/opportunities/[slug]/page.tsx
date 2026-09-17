import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, ExternalLink, Briefcase, Bookmark, Share2, Clock } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { formatDate, getDaysAgo, isExpired, mapDbOpportunityToClient } from "@/lib/utils";
import { isCurrentlyAvailable, computeIstToday, buildAvailabilityDbFilter } from "@/lib/availability";
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
import SaveShareBar from "@/components/opportunities/SaveShareBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

export const revalidate = 3600;

export async function generateStaticParams() {
  if (!supabaseAdmin?.from) return [];
  const today = computeIstToday();

  const { data } = await supabaseAdmin
    .from("opportunities")
    .select("slug, category, deadline, verification_status, posted_date, created_at, last_link_checked, is_active")
    .eq("is_active", true)
    .or(buildAvailabilityDbFilter(today))
    .not("slug", "is", null)
    .limit(200);

  // Post-filter: canonical availability + slug validation
  return (data || [])
    .filter((opp: any) => isCurrentlyAvailable(opp, today))
    .filter((opp: { slug: string }) => opp.slug.length <= 80)
    .map((opp: { slug: string }) => ({ slug: opp.slug }));
}

interface Props {
  params: { slug: string };
}

async function lookupOpportunity(slug: string) {
  if (!supabaseAdmin?.from) return null;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let query = supabaseAdmin
      .from("opportunities")
      .select("*, organizations(*)");

    if (isUuid) {
      query = query.or(`id.eq.${slug},slug.eq.${slug}`);
    } else {
      query = query.eq("slug", slug);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) return null;
    return mapDbOpportunityToClient(data);
  } catch (err) {
    console.error("[Opportunity Lookup Error]:", err);
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const opportunity = await lookupOpportunity(params.slug);
  if (!opportunity) return { title: "Opportunity Not Found" };

  const orgName = opportunity.organization || "";

  let deadlineStr = "Check website";
  if (opportunity.deadline) {
    try {
      deadlineStr = new Date(opportunity.deadline).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      deadlineStr = "Check website";
    }
  }

  return {
    title: orgName ? `${opportunity.title} — ${orgName}` : opportunity.title,
    description: `${opportunity.category} position${orgName ? ` at ${orgName}` : ""}${opportunity.location ? ` in ${opportunity.location}` : ""}.${opportunity.eligibility ? ` Eligibility: ${opportunity.eligibility}.` : ""} Apply by ${deadlineStr}.`,
    keywords: [...(opportunity.tags || []), orgName, opportunity.category, opportunity.location, "BerojgarDegreeWala"].filter(Boolean),
    openGraph: {
      title: orgName ? `${opportunity.title} | ${orgName}` : opportunity.title,
      description: `${opportunity.category} • ${opportunity.location || "India"} • Deadline: ${deadlineStr} • ${opportunity.eligibility || ""}`,
      url: `https://berojgardegreewala.vercel.app/opportunities/${params.slug}`,
      images: [{ url: `https://berojgardegreewala.vercel.app/api/og/opportunity/${params.slug}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: orgName ? `${opportunity.title} | ${orgName}` : opportunity.title,
      images: [`https://berojgardegreewala.vercel.app/api/og/opportunity/${opportunity.slug || params.slug}`],
    },
    alternates: { canonical: `https://berojgardegreewala.vercel.app/opportunities/${opportunity.slug || params.slug}` },
  };
}

function parseSalary(stipendStr?: string | null, location?: string | null) {
  if (!stipendStr) return undefined;
  const cleaned = stipendStr.replace(/,/g, "");
  const numMatch = cleaned.match(/\d+(\.\d+)?/);
  if (!numMatch) return undefined;
  const numValue = parseFloat(numMatch[0]);
  if (isNaN(numValue) || numValue <= 0) return undefined;

  let unitText: "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR" = "MONTH";
  if (/lpa|per annum|year|annually/i.test(stipendStr)) unitText = "YEAR";
  else if (/week/i.test(stipendStr)) unitText = "WEEK";
  else if (/day/i.test(stipendStr)) unitText = "DAY";
  else if (/hour/i.test(stipendStr)) unitText = "HOUR";

  return {
    "@type": "MonetaryAmount",
    currency: location === "Germany" ? "EUR" : location === "Singapore" ? "SGD" : "INR",
    value: {
      "@type": "QuantitativeValue",
      value: numValue,
      unitText,
    },
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
  const opportunity = await lookupOpportunity(params.slug);
  if (!opportunity) notFound();
  const orgName = opportunity.organization || "";

  let isoDeadline: string | undefined = undefined;
  if (opportunity.deadline && !isExpired(opportunity.deadline)) {
    try {
      isoDeadline = new Date(opportunity.deadline).toISOString();
    } catch {
      isoDeadline = undefined;
    }
  }

  const isAcademicAdmissionOrScholarship =
    opportunity.category?.toLowerCase() === "phd" ||
    /\b(phd admission|admissions|scholarship|fellowship program|degree program)\b/i.test(opportunity.title);

  const jsonLd = isAcademicAdmissionOrScholarship
    ? {
        "@context": "https://schema.org",
        "@type": "EducationalOccupationalProgram",
        name: opportunity.title,
        description:
          opportunity.description && opportunity.description.trim().length > 20
            ? opportunity.description
            : `${opportunity.title} at ${orgName || "Official Organization"}. Category: ${opportunity.category}. Eligibility: ${opportunity.eligibility || "Check official portal"}. Apply directly on official website.`,
        provider: orgName
          ? {
              "@type": "EducationalOrganization",
              name: orgName,
              sameAs: opportunity.official_page_url || opportunity.apply_link,
            }
          : undefined,
        applicationDeadline: isoDeadline,
        url: `https://berojgardegreewala.vercel.app/opportunities/${opportunity.slug}`,
      }
    : {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: opportunity.title,
        description:
          opportunity.description && opportunity.description.trim().length > 20
            ? opportunity.description
            : `${opportunity.title} at ${orgName || "Official Organization"}. Category: ${opportunity.category}. Eligibility: ${opportunity.eligibility || "Check official portal"}. Apply directly on official website.`,
        hiringOrganization: orgName
          ? {
              "@type": "Organization",
              name: orgName,
              sameAs: opportunity.official_page_url || opportunity.apply_link,
            }
          : undefined,
        jobLocation: opportunity.location
          ? {
              "@type": "Place",
              address: {
                "@type": "PostalAddress",
                addressLocality: opportunity.location,
                addressCountry: opportunity.location && opportunity.location.match(/India|Delhi|Bangalore|Mumbai|Hyderabad|Noida|Pune|Chennai/i) ? "IN" : opportunity.location === "Germany" ? "DE" : "SG",
              },
            }
          : undefined,
        applicantLocationRequirements: {
          "@type": "Country",
          name: "IN",
        },
        directApply: true,
        employmentType: opportunity.category === "Private Job" || opportunity.category === "Job" ? "FULL_TIME" : opportunity.category === "JRF" || opportunity.category === "SRF" ? "CONTRACTOR" : opportunity.category === "Internship" ? "INTERN" : undefined,
        validThrough: isoDeadline,
        baseSalary: parseSalary(opportunity.stipend, opportunity.location),
        datePosted: opportunity.posted_at || opportunity.created_at || new Date().toISOString(),
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

      {/* Semantic Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap">
          <li>
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/opportunities" className="hover:text-slate-900 transition-colors">
              Opportunities
            </Link>
          </li>
          <li>/</li>
          <li className="text-slate-900 truncate max-w-xs sm:max-w-md" aria-current="page">
            {opportunity.title}
          </li>
        </ol>
      </nav>

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
          {(opportunity.verification_status === "unverified" || opportunity.verification_status === "pending") && (
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
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <ImageWithFallback
                src={opportunity.organization_logo_url}
                alt={`${orgName || "Organization"} logo`}
                name={orgName || "BDW"}
                variant="monogram"
                size={44}
                className="w-11 h-11 rounded-lg border border-slate-200 shadow-xs flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{opportunity.title}</h1>
                {opportunity.org_slug ? (
                  <Link
                    href={`/organizations/${opportunity.org_slug}`}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-0.5 inline-flex items-center gap-1 font-semibold hover:underline"
                  >
                    <span>{orgName || "BerojgarDegreeWala"}</span>
                    <span className="text-xs">&rarr;</span>
                  </Link>
                ) : (
                  <p className="text-slate-600 text-sm mt-0.5">{orgName || "BerojgarDegreeWala"}</p>
                )}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <CategoryBadge category={opportunity.category} />
                  {opportunity.verification_status && <VerificationBadge status={opportunity.verification_status} />}
                  {opportunity.deadline && <DeadlineCountdown deadline={opportunity.deadline} />}
                  {(opportunity.posted_date || opportunity.posted_at || opportunity.created_at) && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        Posted {formatDate(opportunity.posted_date || opportunity.posted_at || opportunity.created_at)}
                      </span>
                    </span>
                  )}
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
          </Card>

          {/* DESCRIPTION */}
          {opportunity.description && (
            <div className="mt-6">
              <div className="flex items-start gap-3">
                <div className="w-1 h-8 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold text-slate-900 mb-2">Description</h2>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{opportunity.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* ELIGIBILITY */}
          {eligibilityItems.length > 0 && (
            <div className="mt-6">
              <div className="flex items-start gap-3">
                <div className="w-1 h-8 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold text-slate-900 mb-2">Eligibility</h2>
                  <ul className="space-y-2">
                    {eligibilityItems.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* QUICK FACTS */}
          <div className="mt-6 p-4 bg-white border border-slate-200 rounded-xl shadow-card">
            <h3 className="font-display text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Quick Facts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Position Type</span>
                <p className="text-slate-900 font-medium">{opportunity.category}</p>
              </div>
              <div>
                <span className="text-slate-400">Organization Type</span>
                <p className="text-slate-900 font-medium">{orgType}</p>
              </div>
              <div>
                <span className="text-slate-400">Work Location</span>
                <p className="text-slate-900 font-medium">{opportunity.location || "On-site"}</p>
              </div>
              {opportunity.eligibility?.match(/NET|GATE/i) && (
                <div>
                  <span className="text-slate-400">NET/GATE Required</span>
                  <p className="text-emerald-600 font-medium">Yes</p>
                </div>
              )}
              {opportunity.stipend && (
                <div>
                  <span className="text-slate-400">Compensation / Stipend</span>
                  <p className="text-slate-900 font-medium">{opportunity.stipend}</p>
                </div>
              )}
              {opportunity.duration && (
                <div>
                  <span className="text-slate-400">Duration</span>
                  <p className="text-slate-900 font-medium">{opportunity.duration}</p>
                </div>
              )}
              {opportunity.experience_required && (
                <div>
                  <span className="text-slate-400">Experience</span>
                  <p className="text-slate-900 font-medium">{opportunity.experience_required}</p>
                </div>
              )}
              {opportunity.min_qualification && (
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-400">Min Qualification</span>
                  <p className="text-slate-900 font-medium truncate" title={opportunity.min_qualification}>{opportunity.min_qualification}</p>
                </div>
              )}
            </div>
          </div>

          {/* RESPONSIBILITIES */}
          {opportunity.responsibilities && Array.isArray(opportunity.responsibilities) && opportunity.responsibilities.length > 0 && (
            <div className="mt-6">
              <div className="flex items-start gap-3">
                <div className="w-1 h-8 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold text-slate-900 mb-2">Key Responsibilities</h2>
                  <ul className="space-y-2">
                    {opportunity.responsibilities.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/80 flex-shrink-0 mt-1.5" />
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
                <div className="w-1 h-8 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold text-slate-900 mb-2">Specific Requirements</h2>
                  <ul className="space-y-2">
                    {opportunity.requirements.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/80 flex-shrink-0 mt-1.5" />
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
                <div className="w-1 h-8 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold text-slate-900 mb-2">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.skills_required.map((skill: string, i: number) => (
                      <Badge key={i} tone="neutral">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {opportunity.tags && opportunity.tags.length > 0 && (
            <div className="mt-6">
              <h2 className="font-display text-sm font-bold text-slate-900 mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {opportunity.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/opportunities?search=${tag}`}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-xs"
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
                deadline={opportunity.deadline}
              />
            )}

            {/* Official Organization Website link */}
            <a
              href={opportunity.official_page_url || opportunity.apply_link || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 font-semibold text-sm rounded-lg px-4 py-2.5 w-full transition-colors shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              Visit Official Organization Website
            </a>

            {/* Save, Share, Copy Link & Calendar Actions */}
            <SaveShareBar
              opportunityId={opportunity.id!}
              title={opportunity.title}
              organization={opportunity.organization}
              deadline={opportunity.deadline}
              slug={opportunity.slug}
            />

            {/* Open to Work banner */}
            <OpenToWorkBanner />

            {/* Quick Facts Card */}
            <Card tone="flat" className="p-4 bg-white border border-slate-200 shadow-card">
              <h3 className="font-display text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Facts</h3>
              <div className="space-y-2.5">
                {opportunity.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">Location</span>
                    <span className="text-slate-900 text-sm font-medium">{opportunity.location}</span>
                  </div>
                )}
                {opportunity.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">Type</span>
                    <span className="text-slate-900 text-sm font-medium">{opportunity.category}</span>
                  </div>
                )}
                {opportunity.deadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">Deadline</span>
                    <span className="text-slate-900 text-sm font-medium">{formatDate(opportunity.deadline)}</span>
                  </div>
                )}
                {(opportunity.posted_date || opportunity.posted_at || opportunity.created_at) && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">Posted Date</span>
                    <span className="text-slate-900 text-sm font-medium">
                      {formatDate(opportunity.posted_date || opportunity.posted_at || opportunity.created_at)}
                    </span>
                  </div>
                )}
                {opportunity.stipend && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">Stipend</span>
                    <span className="text-slate-900 text-sm font-medium">{opportunity.stipend}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Org. Type</span>
                  <span className="text-slate-900 text-sm font-medium">{orgType}</span>
                </div>
              </div>
            </Card>
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
            deadline={opportunity.deadline}
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
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4">
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
            {(opportunity.posted_date || opportunity.posted_at || opportunity.created_at) && (
              <div>
                <span className="text-text-muted">Posted Date</span>
                <p className="text-text-primary font-medium">
                  {formatDate(opportunity.posted_date || opportunity.posted_at || opportunity.created_at)}
                </p>
              </div>
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
