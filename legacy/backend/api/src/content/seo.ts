// SEO metadata generation (Phase 8 of CONTENT_UPGRADE_PLAN.md).
// Rules: SEO title must accurately represent the article; no keyword stuffing;
// never append a year unless the content actually concerns that year.

export interface ArticleSeo {
  seo_title: string;
  meta_description: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

function truncate(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

/** Year is only included when the content actually references it. */
export function buildSeoTitle(title: string, body: string): string {
  const years = body.match(/\b(20\d{2})\b/g);
  const mentionedYear = years ? [...new Set(years)].sort().pop() : null;
  if (mentionedYear && !title.includes(mentionedYear)) {
    return truncate(`${title} ${mentionedYear}`, 70);
  }
  return truncate(title, 70);
}

export function buildMetaDescription(
  summary: string | null | undefined,
  sourceName?: string | null
): string {
  const base = summary || "Latest verified updates from the semiconductor, electronics and research career ecosystem.";
  const suffix = sourceName ? ` Source: ${sourceName}.` : "";
  // Truncate the summary first so the source attribution always survives.
  return `${truncate(base, Math.max(160 - suffix.length, 40))}${suffix}`;
}

export function buildCanonicalUrl(baseUrl: string, slug: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/news/${slug}`;
}

export function buildArticleSeo(input: {
  title: string;
  summary?: string | null;
  slug: string;
  baseUrl?: string;
  sourceName?: string | null;
}): ArticleSeo {
  const canonical_url = buildCanonicalUrl(input.baseUrl || "https://berojgardegreewala.vercel.app", input.slug);
  const seo_title = buildSeoTitle(input.title, input.summary || "");
  const meta_description = buildMetaDescription(input.summary, input.sourceName);
  return {
    seo_title,
    meta_description,
    canonical_url,
    og_title: truncate(input.title, 70),
    og_description: meta_description,
  };
}

export function articleJsonLd(input: {
  title: string;
  slug: string;
  summary?: string | null;
  content?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  author?: string | null;
  publisherName: string;
  baseUrl?: string;
  imageUrl?: string | null;
  faqs?: FaqItem[];
}): Record<string, unknown> {
  const url = buildCanonicalUrl(input.baseUrl || "https://berojgardegreewala.vercel.app", input.slug);
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.title,
    url,
    description: input.summary || undefined,
    datePublished: input.publishedAt || undefined,
    dateModified: input.updatedAt || input.publishedAt || undefined,
    author: { "@type": "Organization", name: input.author || input.publisherName },
    publisher: { "@type": "Organization", name: input.publisherName },
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
  };
  return base;
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** FAQ schema ONLY when real FAQs exist (legitimate questions+answers). */
export function faqJsonLd(faqs: FaqItem[] | null | undefined): Record<string, unknown> | null {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}