import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface GreenhouseJob {
  id: number;
  title: string;
  updated_at: string;
  created_at: string;
  location: { name: string };
  departments: Array<{ id: number; name: string }>;
  absolute_url: string;
  content?: string;
  metadata?: Array<{ id: number; name: string; value: string }>;
}

interface GreenhouseResponse {
  metadata: { total: number };
  jobs: GreenhouseJob[];
}

export class GreenhouseAdapter extends BaseAdapter {
  readonly type = "greenhouse" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const board = source.authentication.credentials?.board ?? source.id;
    const results: GreenhouseJob[] = [];
    let page = 1;
    let total = Infinity;

    while (results.length < total) {
      const url = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true&page=${page}`;
      const res = await this.fetchWithTimeout(url);
      if (!res.ok) break;

      const data: GreenhouseResponse = await res.json();
      total = data.metadata.total;
      results.push(...data.jobs);
      if (data.jobs.length === 0) break;
      page++;
    }

    return results.map((job) => {
      const desc = job.content ? this.stripHtml(job.content) : null;
      return {
        title: this.sanitizeText(job.title),
        organization: board,
        sourceId: source.id,
        sourceUrl: job.absolute_url,
        applyLink: job.absolute_url,
        location: this.sanitizeText(job.location?.name),
        description: desc,
        requirements: this.extractSection(desc, "Requirements"),
        responsibilities: this.extractSection(desc, "Responsibilities"),
        deadline: null,
        postedDate: this.parseDate(job.created_at),
        salary: null,
        eligibility: null,
        type: null,
        workMode: "unknown",
        department: job.departments?.[0]?.name ?? null,
        employmentType: null,
        tags: job.departments.map((d) => d.name),
      };
    });
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private extractSection(
    text: string | null,
    heading: string,
  ): string | null {
    if (!text) return null;
    const re = new RegExp(
      `${heading}[:\\s]*([\\s\\S]*?)(?:(?:Responsibilities|Qualifications|About|Benefits|Requirements)[:\\s]|$)`,
      "i",
    );
    const match = text.match(re);
    return match?.[1]?.trim() ?? null;
  }
}
