import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface RecruiteeJob {
  id: string;
  name: string;
  description: string;
  location: string;
  department: string;
  position: string;
  created_at: string;
  employment_type: string;
  remote: boolean;
}

interface RecruiteeResponse {
  jobs: RecruiteeJob[];
  total: number;
}

export class RecruiteeAdapter extends BaseAdapter {
  readonly type = "recruitee" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const company =
      source.authentication.credentials?.company ?? source.id;
    const apiKey = source.authentication.credentials?.apiKey ?? "";
    const results: RecruiteeJob[] = [];
    let page = 1;
    let total = Infinity;

    while (results.length < total) {
      const url = `https://api.recruitee.com/v2/companies/${company}/jobs?page=${page}`;
      const res = await this.fetchWithTimeout(url, {
        headers: {
          Authorization: `Token token=${apiKey}`,
        },
      });
      if (!res.ok) break;

      const data: RecruiteeResponse = await res.json();
      total = data.total ?? 0;
      results.push(...(data.jobs ?? []));
      if (data.jobs?.length === 0) break;
      page++;
    }

    return results.map((job) => ({
      title: this.sanitizeText(job.name),
      organization: company,
      sourceId: source.id,
      sourceUrl: `https://${company}.recruitee.com/o/${job.name?.toLowerCase().replace(/\s+/g, "-")}`,
      applyLink: `https://${company}.recruitee.com/o/${job.name?.toLowerCase().replace(/\s+/g, "-")}`,
      location: this.sanitizeText(job.location),
      description: this.sanitizeText(job.description),
      requirements: null,
      responsibilities: null,
      deadline: null,
      postedDate: this.parseDate(job.created_at),
      salary: null,
      eligibility: null,
      type: null,
      workMode: job.remote ? "remote" : "unknown",
      department: this.sanitizeText(job.department),
      employmentType: this.sanitizeText(job.employment_type),
      tags: [job.department, job.position].filter(Boolean) as string[],
    }));
  }
}
