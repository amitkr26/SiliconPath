/**
 * Data Freshness & Expiry Engine for Opportunity Intelligence
 * Enforces strict temporal accuracy:
 * - ACTIVE: Deadline in the future (>= today) or recently verified.
 * - EXPIRING_SOON: Deadline within the next 7 days.
 * - EXPIRED: Deadline is strictly in the past (< today).
 * - UNVERIFIED: No official verification timestamp.
 */

export type OpportunityFreshnessStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "UNVERIFIED";

export interface FreshnessMeta {
  status: OpportunityFreshnessStatus;
  daysRemaining: number | null;
  formattedDeadline: string;
  isExpired: boolean;
  freshnessLabel: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
  };
}

export function evaluateOpportunityFreshness(
  deadlineStr?: string | null,
  lastVerifiedAt?: string | null
): FreshnessMeta {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let status: OpportunityFreshnessStatus = "ACTIVE";
  let daysRemaining: number | null = null;
  let formattedDeadline = "Open / Rolling";
  let isExpired = false;

  if (deadlineStr) {
    const deadlineDate = new Date(deadlineStr);
    if (!isNaN(deadlineDate.getTime())) {
      const deadlineMidnight = new Date(
        deadlineDate.getFullYear(),
        deadlineDate.getMonth(),
        deadlineDate.getDate()
      );

      const diffTime = deadlineMidnight.getTime() - todayStart.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysRemaining = diffDays;

      formattedDeadline = deadlineDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      if (diffDays < 0) {
        status = "EXPIRED";
        isExpired = true;
      } else if (diffDays <= 7) {
        status = "EXPIRING_SOON";
      } else {
        status = "ACTIVE";
      }
    }
  } else {
    // If no deadline, check verification recency
    if (!lastVerifiedAt) {
      status = "UNVERIFIED";
    }
  }

  // Verification recency label
  let freshnessLabel = "Verified recently";
  if (lastVerifiedAt) {
    const verifiedDate = new Date(lastVerifiedAt);
    if (!isNaN(verifiedDate.getTime())) {
      const hoursAgo = Math.floor((now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60));
      if (hoursAgo < 24) {
        freshnessLabel = "Verified today";
      } else if (hoursAgo < 48) {
        freshnessLabel = "Verified yesterday";
      } else {
        const days = Math.floor(hoursAgo / 24);
        freshnessLabel = `Verified ${days}d ago`;
      }
    }
  }

  // Visual Badges
  const badgeMap: Record<OpportunityFreshnessStatus, { bg: string; text: string; border: string }> = {
    ACTIVE: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    EXPIRING_SOON: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    },
    EXPIRED: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
    },
    UNVERIFIED: {
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-200",
    },
  };

  return {
    status,
    daysRemaining,
    formattedDeadline,
    isExpired,
    freshnessLabel,
    badgeColor: badgeMap[status],
  };
}
