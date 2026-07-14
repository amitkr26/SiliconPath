import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface BambooHRJob {
  id: string;
  title: string;
  department: string;
  location: string;
  description: string;
  postedDate: string;
  employmentType: string;
  salary: string;
}

export class BambooHRAdapter extends BaseAdapter {
  readonly type = "bamboohr" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const company =
      source.authentication.credentials?.company ?? source.id;
    const apiKey = source.authentication.credentials?.apiKey ?? "";
    const domain =
      source.authentication.credentials?.domain ??
      `${company}.bamboohr.com`;

    const url = `https://${domain}/career/current_openings.json`;
    const res = await this.fetchWithTimeout(url, {
      headers: {
        Authorization: `Basic ${btoa(apiKey + ":x")}`,
      },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      fields?: Array<{ id: string; name: string; value: string }>;
      jobPostings?: BambooHRJob[];
    };

    const postings: BambooHRJob[] =
      data.jobPostings ?? (data.fields ? [data] as BambooHRJob[] : []);

    return postings.map((job) => ({
      title: this.sanitizeText(job.title),
      organization: company,
      sourceId: source.id,
      sourceUrl: `https://${domain}/job/${job.id}`,
      applyLink: `https://${domain}/job/${job.id}`,
      location: this.sanitizeText(job.location),
      description: this.sanitizeText(job.description),
      requirements: null,
      responsibilities: null,
      deadline: null,
      postedDate: this.parseDate(job.postedDate),
      salary: this.sanitizeText(job.salary),
      eligibility: null,
      type: null,
      workMode: "unknown",
      department: this.sanitizeText(job.department),
      employmentType: this.sanitizeText(job.employmentType),
      tags: [job.department].filter(Boolean),
    }));
  }
}
