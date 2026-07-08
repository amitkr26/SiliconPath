export interface ScrapedOpportunity {
  title: string;
  organization: string;
  category: string;
  location: string | null;
  stipend: string | null;
  deadline: string | null;
  eligibility: string | null;
  description: string | null;
  apply_link: string | null;
  source_url: string;
  tags: string[];
}

export interface ScrapeResult {
  source: string;
  success: boolean;
  count: number;
  error?: string;
}

export interface SourceConfig {
  id: string;
  name: string;
  type: "workday" | "greenhouse" | "lever" | "smartrecruiters" | "schema" | "html" | "rss";
  url: string;
  category: string;
  batch: number;
  active: boolean;
  notes?: string;
}
