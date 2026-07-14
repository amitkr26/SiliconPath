import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface ComeetJob {
  uid: string;
  name: string;
  description: string;
  location: string;
  department: string;
  published_at: string;
  employment_type: string;
  remote: boolean;
  apply_url: string;
}

interface ComeetResponse {
  data: ComeetJob[];
  total_count: number;
}

export class ComeetAdapter extends BaseAdapter {
  readonly type = "comeet" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const company =
      source.authentication.credentials?.company ?? source.id;
    const apiKey = source.authentication.credentials?.apiKey ?? "";
    const results: ComeetJob[] = [];
    let page = 1;
    let total = Infinity;

    while (results.length < total) {
      const url = `https://api.comeet.co/companies/${company}/jobs?page=${page}&per_page=100`;
      const res = await this.fetchWithTimeout(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) break;

      const data: ComeetResponse = await res.json();
      total = data.total_count ?? 0;
      results.push(...(data.data ?? []));
      if (data.data?.length === 0) break;
      page++;
    }

    return results.map((job) => ({
      title: this.sanitizeText(job.name),
      organization: company,
      sourceId: source.id,
      sourceUrl:
        job.apply_url ?? `https://careers.comeet.co/${company}/${job.uid}`,
      applyLink: job.apply_url ?? null,
      location: this.sanitizeText(job.location),
      description: this.stripHtml(job.description),
      requirements: null,
      responsibilities: null,
      deadline: null,
      postedDate: this.parseDate(job.published_at),
      salary: null,
      eligibility: null,
      type: null,
      workMode: job.remote ? "remote" : "unknown",
      department: this.sanitizeText(job.department),
      employmentType: this.sanitizeText(job.employment_type),
      tags: [job.department].filter(Boolean),
    }));
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
}
