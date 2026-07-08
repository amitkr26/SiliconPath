// Shared domain types for the public experience.

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  organization_id: string | null;
  category: string;
  location: string | null;
  stipend: string | null;
  deadline: string | null;
  eligibility: string | null;
  description: string | null;
  apply_link: string | null;
  source_url: string;
  source_type: "scraped" | "employer_posted";
  tags: string[];
  is_active: boolean;
  created_at: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string | null;
  summary: string | null;
  published_at: string | null;
}

export interface OpportunityFilters {
  category?: string;
  location?: string;
  search?: string;
  /** ISO date lower bound on deadline. */
  deadlineAfter?: string;
  limit?: number;
  offset?: number;
}

export const CATEGORIES: { value: string; label: string }[] = [
  { value: "jrf-srf", label: "JRF / SRF" },
  { value: "phd", label: "Fully Funded PhD" },
  { value: "govt-psu", label: "Government / PSU" },
  { value: "private-vlsi", label: "Private VLSI" },
  { value: "fellowship-intl", label: "International Fellowship" },
  { value: "internship", label: "Internship" },
];
