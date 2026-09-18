/**
 * BDW SEO route registry — single source of truth for which public pages
 * exist and how the engine should evaluate them. Mirrors the real App Router
 * surface (frontend/src/app) WITHOUT importing page modules, so the engine
 * stays pure (no Supabase / Next dependencies at import time).
 */

export const SITE_URL = "https://berojgardegreewala.vercel.app";

export interface RegistryPage {
  url: string;
  pageType: import("./types").PageType;
  title?: string;
  description?: string;
  /** Category / location / role when this is a programmatic page. */
  programmatic?: import("./types").ProgrammaticDimension;
  /** Structured-data types declared in the rendered markup. */
  declaredSchemas?: string[];
  /** Static pages are always eligible for indexing (gated later by content). */
  staticIndexable?: boolean;
}

/** Static hub pages (greedy 1:1 with sitemap.ts STATIC_PAGES). */
export const HUB_PAGES: RegistryPage[] = [
  { url: SITE_URL, pageType: "home", title: "BerojgarDegreeWala — Semiconductor, VLSI & Electronics Opportunities India", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/opportunities`, pageType: "hub", title: "Semiconductor Jobs, JRF Positions & VLSI Opportunities", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/news`, pageType: "hub", title: "Semiconductor & VLSI News", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/organizations`, pageType: "hub", title: "Semiconductor Companies Directory", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/categories`, pageType: "hub", title: "Opportunity Categories", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/about`, pageType: "hub", title: "About BerojgarDegreeWala", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/resources`, pageType: "hub", title: "Resources — JRF Guide, PhD Guide, DRDO Labs, CSIR Research", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/contact`, pageType: "hub", title: "Contact", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/ask-ai`, pageType: "hub", title: "Ask AI", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
];

/** Programmatic category landing pages (canonical slugs). */
export const CATEGORY_SLUGS = ["jrf", "srf", "phd", "govt-job", "fellowship", "private", "international"] as const;

/** Programmatic location hub slugs (mirror sitemap LOCATION_HUBS). */
export const LOCATION_SLUGS = ["bengaluru", "hyderabad", "noida", "pune", "chennai", "ahmedabad"] as const;

/** Programmatic role hub slugs (Phase 3: Role × Location hubs). */
export const ROLE_SLUGS = ["physical-design", "rtl-design", "design-verification", "dft", "embedded-systems"] as const;

/** URL helpers for programmatic pages. */
export function categoryUrl(slug: string): string {
  return `${SITE_URL}/category/${slug.toLowerCase()}`;
}

export function locationUrl(slug: string): string {
  return `${SITE_URL}/opportunities/location/${slug.toLowerCase()}`;
}

export function opportunityUrl(slug: string): string {
  return `${SITE_URL}/opportunities/${slug}`;
}

export function organizationUrl(slug: string): string {
  return `${SITE_URL}/organizations/${slug}`;
}

export function roleUrl(slug: string): string {
  return `${SITE_URL}/opportunities/role/${slug}`;
}

export function fresherUrl(): string {
  return `${SITE_URL}/opportunities/freshers`;
}

export function newsUrl(slug: string): string {
  return `${SITE_URL}/news/${slug}`;
}

/** Resource / guide pages (mirror sitemap RESOURCE_PAGES). */
export const RESOURCE_PAGES: RegistryPage[] = [
  { url: `${SITE_URL}/resources/jrf-guide`, pageType: "resource", title: "Complete JRF Guide 2026 — Electronics Science", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/resources/jrf-vs-srf-difference`, pageType: "resource", title: "JRF vs SRF vs Research Associate: What's the Difference?", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/resources/drdo-recruitment-electronics`, pageType: "resource", title: "DRDO Recruitment Process for Electronics Engineers: Complete Guide", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/resources/phd-guide`, pageType: "resource", title: "PhD in Electronics India 2026 — Admission Guide", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/resources/fully-funded-phd-vlsi-abroad`, pageType: "resource", title: "How to Get a Fully-Funded PhD in VLSI & Semiconductors Abroad", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/resources/international-fellowships`, pageType: "resource", title: "International Fellowships for Electronics Researchers India 2026", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/resources/net-vs-gate`, pageType: "resource", title: "UGC-NET vs GATE for Electronics Research — Complete Comparison 2026", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/resources/vlsi-careers`, pageType: "resource", title: "VLSI Career India 2026 — Jobs, Salaries, Skills & Companies", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
  { url: `${SITE_URL}/resources/vlsi-career-guide`, pageType: "resource", title: "VLSI Career Guide — Semiconductor Jobs & Skills", staticIndexable: true, declaredSchemas: ["WebSite", "Organization"] },
];

export const REGISTRY_STATIC: RegistryPage[] = [...HUB_PAGES, ...RESOURCE_PAGES];

export function buildProgrammaticPages(): RegistryPage[] {
  const pages: RegistryPage[] = [];
  for (const cat of CATEGORY_SLUGS) {
    pages.push({
      url: categoryUrl(cat),
      pageType: "category",
      programmatic: { category: cat },
      staticIndexable: true,
      declaredSchemas: ["WebSite", "Organization", "BreadcrumbList", "ItemList"],
    });
  }
  for (const city of LOCATION_SLUGS) {
    pages.push({
      url: locationUrl(city),
      pageType: "location",
      programmatic: { location: city },
      staticIndexable: true,
      declaredSchemas: ["WebSite", "Organization", "BreadcrumbList", "ItemList"],
    });
  }
  for (const role of ROLE_SLUGS) {
    pages.push({
      url: roleUrl(role),
      pageType: "category",
      programmatic: { role },
      staticIndexable: true,
      declaredSchemas: ["WebSite", "Organization", "BreadcrumbList", "ItemList"],
    });
  }
  return pages;
}

export function pathFromUrl(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}