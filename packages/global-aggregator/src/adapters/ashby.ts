import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface AshbyJob {
  id: string;
  title: string;
  departmentName: string;
  locationName: string;
  isRemote: boolean;
  employmentType: string;
  createdAt: string;
  descriptionHtml: string;
  locationId: string;
  teamName: string;
}

interface AshbyResponse {
  jobPostings: AshbyJob[];
}

export class AshbyAdapter extends BaseAdapter {
  readonly type = "ashby" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const board =
      source.authentication.credentials?.board ?? source.id;
    const url = `https://api.ashbyhq.com/posting-api/job-board/${board}`;
    const res = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) return [];

    const data: AshbyResponse = await res.json();
    const postings = data.jobPostings ?? [];

    return postings.map((job) => {
      const desc = this.stripHtml(job.descriptionHtml);
      return {
        title: this.sanitizeText(job.title),
        organization: board,
        sourceId: source.id,
        sourceUrl: `https://jobs.ashbyhq.com/${board}/${job.id}`,
        applyLink: `https://jobs.ashbyhq.com/${board}/${job.id}`,
        location: this.sanitizeText(job.locationName),
        description: desc,
        requirements: null,
        responsibilities: null,
        deadline: null,
        postedDate: this.parseDate(job.createdAt),
        salary: null,
        eligibility: null,
        type: null,
        workMode: job.isRemote ? "remote" : "unknown",
        department: this.sanitizeText(job.departmentName),
        employmentType: this.sanitizeText(job.employmentType),
        tags: [job.departmentName, job.teamName].filter(Boolean) as string[],
      };
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
}
