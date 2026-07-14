import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface WorkdayJobPosting {
  bulletFields: string[];
  extensions: Record<string, string>;
  jobCategory: string;
  jobDescription: string;
  location: string;
  additionalLocations: string[];
  jobId: string;
  postedOn: string;
  title: string;
}

interface WorkdayResponse {
  jobPostings: WorkdayJobPosting[];
  total: number;
  limit: number;
  offset: number;
}

export class WorkdayAdapter extends BaseAdapter {
  readonly type = "workday" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const baseUrl =
      source.authentication.credentials?.baseUrl ?? source.id;
    const results: WorkdayJobPosting[] = [];
    let offset = 0;
    const limit = 20;

    while (true) {
      const url = baseUrl.replace(/\/$/, "") + "/wday/cxs/" + source.id;
      const res = await this.fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit, offset, searchText: "" }),
      });
      if (!res.ok) break;

      const data: WorkdayResponse = await res.json();
      results.push(...data.jobPostings);
      offset += limit;
      if (offset >= data.total || data.jobPostings.length === 0) break;
    }

    return results.map((job) => {
      const desc = this.stripHtml(job.jobDescription);
      return {
        title: this.sanitizeText(job.title),
        organization: source.id,
        sourceId: source.id,
        sourceUrl: `${baseUrl.replace(/\/$/, "")}/jobPosting/${job.jobId}`,
        applyLink: `${baseUrl.replace(/\/$/, "")}/jobPosting/${job.jobId}`,
        location: this.sanitizeText(job.location),
        description: desc,
        requirements: null,
        responsibilities: null,
        deadline: null,
        postedDate: this.parseDate(job.postedOn),
        salary: null,
        eligibility: null,
        type: this.sanitizeText(job.jobCategory),
        workMode: "unknown",
        department: this.sanitizeText(job.extensions?.jobFamily),
        employmentType: this.sanitizeText(job.extensions?.timeType),
        tags: [job.jobCategory].filter(Boolean),
      };
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
}
