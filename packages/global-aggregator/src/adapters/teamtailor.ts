import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface TeamtailorJob {
  id: string;
  title: string;
  description: string;
  "descriptionHtml": string;
  city: string;
  country: string;
  remote: boolean;
  publishedAt: string;
  department: string;
  position: string;
  location: string;
  employmentType: string;
  applyUrl: string;
}

interface TeamtailorResponse {
  data: TeamtailorJob[];
  meta: { totalCount: number; pageCount: number };
}

export class TeamtailorAdapter extends BaseAdapter {
  readonly type = "teamtailor" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const company =
      source.authentication.credentials?.company ?? source.id;
    const apiKey = source.authentication.credentials?.apiKey ?? "";
    const results: TeamtailorJob[] = [];
    let page = 1;

    while (true) {
      const url = `https://api.teamtailor.com/v1/job-posts?page[size]=50&page[number]=${page}`;
      const res = await this.fetchWithTimeout(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Api-Key": apiKey,
        },
      });
      if (!res.ok) break;

      const data: TeamtailorResponse = await res.json();
      results.push(...data.data);
      if (
        data.data.length === 0 ||
        page >= (data.meta?.pageCount ?? 1)
      )
        break;
      page++;
    }

    return results.map((job) => ({
      title: this.sanitizeText(job.title),
      organization: company,
      sourceId: source.id,
      sourceUrl:
        job.applyUrl ?? `https://${company}.teamtailor.com/jobs/${job.id}`,
      applyLink:
        job.applyUrl ?? `https://${company}.teamtailor.com/jobs/${job.id}`,
      location: this.sanitizeText(
        job.location || [job.city, job.country].filter(Boolean).join(", "),
      ),
      description: this.sanitizeText(job.description),
      requirements: null,
      responsibilities: null,
      deadline: null,
      postedDate: this.parseDate(job.publishedAt),
      salary: null,
      eligibility: null,
      type: null,
      workMode: job.remote ? "remote" : "unknown",
      department: this.sanitizeText(job.department),
      employmentType: this.sanitizeText(job.employmentType),
      tags: [job.department, job.position].filter(Boolean) as string[],
    }));
  }
}
