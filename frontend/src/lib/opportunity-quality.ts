/**
 * Deterministic Opportunity Quality & Signal Scorer.
 * Input: raw opportunities row.
 * Output: { score: 0..100, reason: string, details: StructuredQualityDetails }
 *
 * Scoring Architecture (Decoupled Dimensions):
 *   1. Link Reachability (15%)  - HTTP probe health (200, 404, etc.) - DOES NOT imply verified content
 *   2. Content Completeness (40%) - Title (10), Description (15), Eligibility (15)
 *   3. Source Trust (20%)       - Organization entity linkage (10), Source URL (10)
 *   4. Freshness & Action (25%) - Apply URL (15), Deadline viability (10)
 *
 * Total Score is bounded strictly within [0, 100].
 */

export interface StructuredQualityDetails {
  link_reachability_score: number;
  content_completeness_score: number;
  source_trust_score: number;
  actionability_score: number;
  total_score: number;
  positive_signals: string[];
  risk_signals: string[];
  calculated_at: string;
}

export interface QualityScore {
  score: number;
  reason: string;
  details: StructuredQualityDetails;
}

export interface OppScoringInput {
  title?: string | null;
  description?: string | null;
  eligibility?: string | null;
  apply_url?: string | null;
  source_url?: string | null;
  link_check_status?: number | null;
  deadline?: string | null;
  organization?: string | null;
  organization_id?: string | null;
  tags?: string[] | null;
  is_active?: boolean | null;
  verification_status?: string | null;
}

export function computeOpportunityQualityScore(opp: OppScoringInput): QualityScore {
  let linkScore = 0;
  let contentScore = 0;
  let sourceScore = 0;
  let actionScore = 0;

  const positiveSignals: string[] = [];
  const riskSignals: string[] = [];

  // ── 1. LINK REACHABILITY (15 pts max) ──
  const lcs = opp.link_check_status;
  if (lcs === 200) {
    linkScore = 15;
    positiveSignals.push("Apply link verified reachable (HTTP 200)");
  } else if (lcs === 0 || lcs == null) {
    linkScore = 5;
    riskSignals.push("Apply link reachability pending automated check");
  } else if (lcs === 404 || lcs === 500) {
    linkScore = 0;
    riskSignals.push(`Apply link returned HTTP ${lcs} error`);
  } else {
    linkScore = 5;
    riskSignals.push(`Apply link returned HTTP ${lcs}`);
  }

  // ── 2. CONTENT COMPLETENESS (40 pts max) ──
  // Title (10 pts)
  const titleLen = (opp.title ?? "").trim().length;
  if (titleLen >= 20) {
    contentScore += 10;
    positiveSignals.push("Descriptive title");
  } else if (titleLen >= 8) {
    contentScore += 5;
    riskSignals.push("Short or generic title");
  } else {
    riskSignals.push("Missing or extremely short title");
  }

  // Description (15 pts)
  const descLen = (opp.description ?? "").trim().length;
  if (descLen >= 300) {
    contentScore += 15;
    positiveSignals.push("Comprehensive job description");
  } else if (descLen >= 100) {
    contentScore += 8;
    riskSignals.push("Brief job description (<300 characters)");
  } else {
    riskSignals.push("Missing job description");
  }

  // Eligibility (15 pts)
  const eligLen = (opp.eligibility ?? "").trim().length;
  if (eligLen >= 20) {
    contentScore += 15;
    positiveSignals.push("Explicit eligibility criteria provided");
  } else {
    riskSignals.push("Missing candidate eligibility/qualification requirements");
  }

  // ── 3. SOURCE TRUST (20 pts max) ──
  if (opp.organization_id) {
    sourceScore += 10;
    positiveSignals.push("Linked to verified organization record");
  } else if ((opp.organization ?? "").trim().length >= 3) {
    sourceScore += 5;
    riskSignals.push("Organization text only (no entity linkage)");
  } else {
    riskSignals.push("Missing employer organization");
  }

  if (opp.source_url && opp.source_url.startsWith("http")) {
    sourceScore += 10;
    positiveSignals.push("Original source publication URL present");
  } else {
    riskSignals.push("No original citation/source URL");
  }

  // ── 4. FRESHNESS & ACTIONABILITY (25 pts max) ──
  if (opp.apply_url && opp.apply_url.length > 5) {
    actionScore += 15;
    positiveSignals.push("Direct application URL present");
  } else {
    riskSignals.push("Missing apply URL");
  }

  if (opp.deadline) {
    const dl = new Date(opp.deadline);
    if (!isNaN(dl.getTime()) && dl > new Date()) {
      actionScore += 10;
      positiveSignals.push(`Active application deadline (${opp.deadline.slice(0, 10)})`);
    } else {
      actionScore += 2;
      riskSignals.push("Application deadline is expired or invalid");
    }
  } else {
    actionScore += 5;
    positiveSignals.push("Rolling or unstated deadline");
  }

  // Calculate clamped total
  const rawTotal = linkScore + contentScore + sourceScore + actionScore;
  const totalScore = Math.min(100, Math.max(0, rawTotal));

  const details: StructuredQualityDetails = {
    link_reachability_score: linkScore,
    content_completeness_score: contentScore,
    source_trust_score: sourceScore,
    actionability_score: actionScore,
    total_score: totalScore,
    positive_signals: positiveSignals,
    risk_signals: riskSignals,
    calculated_at: new Date().toISOString(),
  };

  const reason = riskSignals.length === 0
    ? "High-integrity listing with all quality criteria satisfied."
    : `Quality alerts: ${riskSignals.join("; ")}`;

  return {
    score: totalScore,
    reason,
    details,
  };
}
