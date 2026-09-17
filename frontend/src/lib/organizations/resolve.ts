/**
 * P0.3 — Evidence-gated organization resolution (Phase 1.4).
 *
 * NEVER assigns an `organization_id` (or creates an org row) without evidence:
 *   - hostname/domain match against a known org's `website`
 *   - ATS board token / host label match against an org's `slug`/`name`
 *   - exact normalized name match against the org table
 *   - title contains a known org name (medium confidence, still evidence)
 *
 * A bare person-name string ("Sadia Munir") is never accepted as an org.
 * Pure module (zero imports) so the backfill script can run it directly.
 */

export interface OrgRow {
  id: string;
  name: string;
  slug: string | null;
  website: string | null;
}

export interface ResolveResult {
  name: string | null;
  organizationId: string | null;
  confidence: "high" | "medium" | "none";
}

// Host labels that are ATS plumbing, never an org identity.
const GENERIC_HOST_LABELS = new Set([
  "www", "boards", "job-boards", "jobs", "careers", "apply",
  "recruiting", "recruit", "rq", "careers-page", "career",
]);

// Display fallback for known domains not (yet) in the org table — moved from
// lib/utils.ts inferAuthenticOrganization so resolution lives in one module.
const DOMAIN_DISPLAY_NAMES: Record<string, string> = {
  "arm.com": "Arm Ltd",
  "apple.com": "Apple",
  "westerndigital.com": "Western Digital",
  "qualcomm.com": "Qualcomm",
  "intel.com": "Intel Corporation",
  "amd.com": "AMD",
  "nvidia.com": "NVIDIA",
  "synopsys.com": "Synopsys",
  "cadence.com": "Cadence Design Systems",
  "tataelectronics.com": "Tata Electronics",
  "micron.com": "Micron Technology",
  "ti.com": "Texas Instruments",
  "drdo.gov.in": "DRDO",
  "isro.gov.in": "ISRO",
  "csir.res.in": "CSIR",
  "iitb.ac.in": "IIT Bombay",
  "iitm.ac.in": "IIT Madras",
  "iisc.ac.in": "IISc Bangalore",
  "scl.gov.in": "SCL Mohali",
  "cdac.in": "C-DAC",
  "mindgrovetech.in": "Mindgrove Technologies",
  "saankhyalabs.com": "Saankhya Labs",
  "signalchip.com": "Signalchip",
  "incoresemi.com": "InCore Semiconductors",
  "tessolve.com": "Tessolve Semiconductor",
  "aurasemi.com": "Aura Semiconductor",
  "centumelectronics.com": "Centum Electronics",
  "mirafra.com": "Mirafra Technologies",
  "einfochips.com": "eInfochips",
  "truechip.net": "Truechip Solutions",
  "kaynestechnology.net": "Kaynes Semicon",
  "insemitech.com": "InSemi Technology",
  "morphingmachines.com": "Morphing Machines",
  "fermionic.design": "FermionIC Design",
};

const ORG_KEYWORD =
  /(university|institute|institut|college|academy|laboratory|lab|research|technolog|semiconductor|electronics|government|ministry|department|commission|council|board|ltd|limited|inc|corp|india|pvt|private|centre|center|foundation|agency|group|systems|solutions|global|international|authority|trust|society|company|industries|organization|organisation)/i;

function normalizeName(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

function bareHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * ATS board identity: greenhouse/lever pathname token
 * (`boards.greenhouse.io/tenstorrent` → "tenstorrent") or first host label
 * (`nvidia.wd3.myworkdayjobs.com` → "nvidia", `company.recruitee.io` → "company").
 */
export function extractBoardToken(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path0 = u.pathname.split("/").filter(Boolean)[0];
    if (
      host.endsWith("greenhouse.io") || host.endsWith("lever.co") ||
      host.endsWith("ashbyhq.com") || host.endsWith("recruitee.io") ||
      host.endsWith("smartrecruiters.com")
    ) {
      return path0 || null;
    }
    const labels = host.split(".");
    const first = labels[0];
    if (labels.length >= 2 && first && !GENERIC_HOST_LABELS.has(first)) return first;
    return null;
  } catch {
    return null;
  }
}

/** "Sadia Munir" / "Muhammad Faizan" — 2+ capitalized words, no org keyword. */
export function looksLikePersonName(name: string): boolean {
  const n = (name || "").trim();
  if (!n || n.length < 3) return true;
  if (ORG_KEYWORD.test(n)) return false;
  const words = n.split(/[\s.,\-()]+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;
  // every word a capitalized common name AND no acronym (DRDO, IIT...)
  return (
    words.every((w) => /^[A-Z][a-z]{1,}$/.test(w)) &&
    !words.some((w) => /^[A-Z]{2,}$/.test(w))
  );
}

function matchByTable(
  host: string | null,
  token: string | null,
  name: string | null,
  orgs: OrgRow[]
): OrgRow | null {
  if (orgs.length === 0) return null;

  // 1. Hostname evidence (exact or subdomain of a known org website)
  if (host) {
    for (const o of orgs) {
      const wh = bareHost(o.website);
      if (wh && (host === wh || host.endsWith("." + wh))) return o;
    }
  }

  // 2. ATS board token / first host label vs slug or normalized name
  if (token) {
    const t = normalizeName(token);
    if (t.length >= 3) {
      for (const o of orgs) {
        if (o.slug && normalizeName(o.slug) === t) return o;
        if (normalizeName(o.name) === t) return o;
      }
    }
  }

  // 2b. Any host label matching an org slug/name (e.g. "isro.gov.in" → slug "isro"
  // when the org has no website recorded).
  if (host) {
    for (const label of host.split(".")) {
      const l = normalizeName(label);
      if (l.length < 3) continue;
      for (const o of orgs) {
        if (o.slug && normalizeName(o.slug) === l) return o;
        if (normalizeName(o.name) === l) return o;
      }
    }
  }

  // 3. Exact normalized name match
  if (name) {
    const n = normalizeName(name);
    if (n.length >= 3) {
      for (const o of orgs) {
        if (normalizeName(o.name) === n) return o;
      }
    }
  }

  return null;
}

function matchByTitle(title: string | null | undefined, orgs: OrgRow[]): OrgRow | null {
  if (!title || orgs.length === 0) return null;
  const t = title.toLowerCase();
  for (const o of orgs) {
    const n = o.name.toLowerCase().trim();
    if (n.length >= 4 && t.includes(n)) return o;
  }
  return null;
}

export function resolveOrganization(opts: {
  sourceUrl?: string | null;
  title?: string | null;
  name?: string | null;
  organizations: OrgRow[];
}): ResolveResult {
  const host = bareHost(opts.sourceUrl);
  const token = extractBoardToken(opts.sourceUrl);
  const tableOrg = matchByTable(host, token, opts.name ?? null, opts.organizations);
  if (tableOrg) {
    return { name: tableOrg.name, organizationId: tableOrg.id, confidence: "high" };
  }

  const titleOrg = matchByTitle(opts.title, opts.organizations);
  if (titleOrg) {
    return { name: titleOrg.name, organizationId: titleOrg.id, confidence: "medium" };
  }

  // 4. Known-domain display fallback (no org row yet — id stays null)
  if (host) {
    for (const [domain, display] of Object.entries(DOMAIN_DISPLAY_NAMES)) {
      if (host === domain || host.endsWith("." + domain)) {
        return { name: display, organizationId: null, confidence: "medium" };
      }
    }
  }

  // 5. Name-only (no table/domain evidence): guard against person names.
  if (opts.name && !looksLikePersonName(opts.name)) {
    return { name: opts.name, organizationId: null, confidence: "medium" };
  }

  return { name: null, organizationId: null, confidence: "none" };
}
