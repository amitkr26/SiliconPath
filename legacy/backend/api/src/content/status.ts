// Opportunity status derivation (Phase 7 of CONTENT_UPGRADE_PLAN.md).
// Status is DERIVED from verified dates only — never inferred from the fact
// that a scraper fetched the page, and never fabricated when dates are absent.

export type OpportunityStatus = "upcoming" | "open" | "closing_soon" | "closed" | "archived" | "unknown";

export interface StatusInput {
  application_deadline?: string | null;      // ISO date or null
  application_start?: string | null;         // ISO date or null
  posted_date?: string | null;               // ISO date or null
  is_active?: boolean;
  is_archived?: boolean;
  /** days before deadline at which status flips to closing_soon */
  closingThresholdDays?: number;
  today?: Date;
}

export function deriveStatus(input: StatusInput): OpportunityStatus {
  const today = (input.today || new Date()).toISOString().slice(0, 10);
  const threshold = input.closingThresholdDays ?? 7;
  const deadline = input.application_deadline || null;
  const start = input.application_start || null;

  if (input.is_archived) return "archived";
  if (!deadline) return "unknown"; // never "open" without a verified deadline

  const compare = (iso: string | null) => (iso ? (iso < today ? -1 : iso > today ? 1 : 0) : null);

  if (compare(deadline) === -1) return "closed";

  // deadline >= today here
  if (start && compare(start) === 1) return "upcoming";

  if (compare(deadline) === 0) return "closing_soon"; // due today

  // deadline is in the future
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((new Date(`${deadline}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / msPerDay);
  if (daysLeft <= threshold) return "closing_soon";
  return "open";
}

export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  upcoming: "Upcoming",
  open: "Open",
  closing_soon: "Closing Soon",
  closed: "Closed",
  archived: "Archived",
  unknown: "Not specified",
};