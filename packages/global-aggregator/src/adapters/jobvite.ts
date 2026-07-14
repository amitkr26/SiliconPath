import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface JobviteJob {
  jobId: string;
  title: string;
  description: string;
  postedDate: string;
  city: string;
  state: string;
  country: string;
  department: string;
  employmentType: string;
  location: string;
  categories: string[];
  url: string;
}

interface JobviteResponse {
  jobs: {
    job: JobviteJob[];
    total: number;
  };
}

export class JobviteAdapter extends BaseAdapter {
  readonly type = "jobvite" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const company =
      source.authentication.credentials?.company ?? source.id;
    const results: JobviteJob[] = [];
    let page = 1;
    let total = Infinity;

    while (results.length < total) {
      const url = `https://api.jobvite.com/api/v2/company/${company}/jobs?page=${page}`;
      const res = await this.fetchWithTimeout(url);
      if (!res.ok) break;

      const data: JobviteResponse = await res.json();
      const jobs = data.jobs?.job ?? [];
      total = data.jobs?.total ?? 0;
      results.push(...jobs);
      if (jobs.length === 0) break;
      page++;
    }

    return results.map((job) => ({
      title: this.sanitizeText(job.title),
      organization: company,
      sourceId: source.id,
      sourceUrl:
        job.url ?? `https://jobs.jobvite.com/${company}/job/${job.jobId}`,
      applyLink:
        job.url ?? `https://jobs.jobvite.com/${company}/job/${job.jobId}`,
      location: this.sanitizeText(
        job.location || [job.city, job.state, job.country].filter(Boolean).join(", "),
      ),
      description: this.stripHtml(job.description),
      requirements: null,
      responsibilities: null,
      deadline: null,
      postedDate: this.parseDate(job.postedDate),
      salary: null,
      eligibility: null,
      type: null,
      workMode: "unknown",
      department: this.sanitizeText(job.department),
      employmentType: this.sanitizeText(job.employmentType),
      tags: job.categories ?? [],
    }));
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
}
