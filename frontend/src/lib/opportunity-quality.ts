export interface QualityScoreResult {
  quality_score: number;
  quality_breakdown: {
    source_trust: number;
    source_link: number;
    application_link: number;
    deadline_validity: number;
    org_verification: number;
    title_quality: number;
    description_completeness: number;
    penalties: number;
  };
  quality_reason: string;
  recommended_lifecycle: "active" | "expired" | "broken_link" | "archived" | "draft";
  recommended_verification: "verified" | "pending" | "rejected" | "unverified";
}

export interface OpportunityLike {
  title?: string;
  description?: string;
  source_url?: string;
  application_url?: string;
  deadline?: string | null;
  organization?: string | { name?: string; is_verified?: boolean } | null;
  category?: string;
  is_active?: boolean;
  verification_status?: string;
}

const TRUSTED_DOMAINS = [
  "isro.gov.in",
  "drdo.gov.in",
  "csir.res.in",
  "iisc.ac.in",
  "iitb.ac.in",
  "iitd.ac.in",
  "iitm.ac.in",
  "iitkgp.ac.in",
  "iitr.ac.in",
  "iitg.ac.in",
  "iith.ac.in",
  "cdac.in",
  "scl.gov.in",
  "nielit.gov.in",
  "intel.com",
  "qualcomm.com",
  "ti.com",
  "amd.com",
  "nvidia.com",
  "synopsys.com",
  "cadence.com",
  "arm.com",
  "nxp.com",
  "broadcom.com",
  "appliedmaterials.com",
  "asml.com",
];

export function computeOpportunityQualityScore(opp: OpportunityLike): QualityScoreResult {
  let sourceTrust = 10;
  let sourceLink = 0;
  let appLink = 0;
  let deadlineValidity = 0;
  let orgVerification = 5;
  let titleQuality = 5;
  let descCompleteness = 0;
  let penalties = 0;
  const reasons: string[] = [];

  // 1. Source Trustworthiness (0–20)
  if (opp.source_url) {
    try {
      const parsed = new URL(opp.source_url);
      const host = parsed.hostname.toLowerCase();
      if (TRUSTED_DOMAINS.some((d) => host.endsWith(d))) {
        sourceTrust = 20;
        reasons.push("Official recognized semiconductor or research domain (+20)");
      } else if (host.endsWith(".gov.in") || host.endsWith(".edu") || host.endsWith(".ac.in")) {
        sourceTrust = 18;
        reasons.push("Academic/Govt official host (+18)");
      } else {
        sourceTrust = 12;
      }
    } catch {
      sourceTrust = 2;
      penalties += 10;
      reasons.push("Malformed source URL (-10)");
    }
  }

  // 2. Official Source Link (0–15)
  if (opp.source_url && opp.source_url.startsWith("http")) {
    sourceLink = 15;
  }

  // 3. Application Link Validity (0–15)
  if (opp.application_url && opp.application_url.startsWith("http")) {
    appLink = 15;
  } else if (opp.source_url && opp.source_url.startsWith("http")) {
    appLink = 10; // Fallback to source URL
  }

  // 4. Deadline Validity (0–10)
  let isExpired = false;
  if (opp.deadline) {
    const deadlineDate = new Date(opp.deadline);
    if (!isNaN(deadlineDate.getTime())) {
      const now = new Date();
      if (deadlineDate.getTime() > now.getTime()) {
        deadlineValidity = 10;
        reasons.push("Future deadline validated (+10)");
      } else {
        deadlineValidity = 0;
        isExpired = true;
        penalties += 15;
        reasons.push("Deadline has passed (-15)");
      }
    }
  } else {
    deadlineValidity = 5; // Rolling or unspecified
  }

  // 5. Organization Verification (0–10)
  if (opp.organization) {
    if (typeof opp.organization === "object" && opp.organization.is_verified) {
      orgVerification = 10;
      reasons.push("Verified Organization (+10)");
    } else {
      orgVerification = 8;
    }
  }

  // 6. Title Quality (0–10)
  if (opp.title && opp.title.trim().length >= 10) {
    const t = opp.title.trim();
    // Check for messy concatenated titles
    if (t.length < 150 && !t.includes(">>>") && !t.includes("CLICK HERE")) {
      titleQuality = 10;
    } else {
      titleQuality = 4;
      penalties += 5;
    }
  }

  // 7. Description Completeness (0–10)
  if (opp.description && opp.description.trim().length >= 100) {
    descCompleteness = 10;
  } else if (opp.description && opp.description.trim().length >= 30) {
    descCompleteness = 5;
  } else {
    penalties += 5;
    reasons.push("Sparse description (-5)");
  }

  // Calculate raw total and clamp to [0, 100]
  const rawScore =
    sourceTrust +
    sourceLink +
    appLink +
    deadlineValidity +
    orgVerification +
    titleQuality +
    descCompleteness -
    penalties;

  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Determine recommended statuses
  let recommendedLifecycle: "active" | "expired" | "broken_link" | "archived" | "draft" = "active";
  let recommendedVerification: "verified" | "pending" | "rejected" | "unverified" = "pending";

  if (isExpired) {
    recommendedLifecycle = "expired";
  } else if (!opp.source_url && !opp.application_url) {
    recommendedLifecycle = "broken_link";
    recommendedVerification = "rejected";
  } else if (finalScore >= 75) {
    recommendedLifecycle = "active";
    recommendedVerification = "verified";
  } else if (finalScore < 40) {
    recommendedLifecycle = "archived";
    recommendedVerification = "rejected";
  }

  return {
    quality_score: finalScore,
    quality_breakdown: {
      source_trust: sourceTrust,
      source_link: sourceLink,
      application_link: appLink,
      deadline_validity: deadlineValidity,
      org_verification: orgVerification,
      title_quality: titleQuality,
      description_completeness: descCompleteness,
      penalties,
    },
    quality_reason: reasons.join("; ") || "Standard deterministic verification completed.",
    recommended_lifecycle: recommendedLifecycle,
    recommended_verification: recommendedVerification,
  };
}
