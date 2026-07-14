import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface ICIMSJob {
  id: number;
  title: string;
  description: string;
  posted_date: string;
  location: { city: string; state: string; country: string };
  department: string;
  employment_type: string;
  requisition_id: string;
  apply_url: string;
}

export class ICIMSAdapter extends BaseAdapter {
  readonly type = "icims" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const company =
      source.authentication.credentials?.company ?? source.id;
    const apiUrl =
      source.authentication.credentials?.apiUrl ??
      `https://${company}.icims.com/jobs/search`;

    const allJobs: ICIMSJob[] = [];
    let offset = 1;
    const limit = 100;

    while (true) {
      const url = `${apiUrl}?ss=1&searchKeyword=&max=${limit}&offset=${offset}&mode=job&schemaId=`;
      const res = await this.fetchWithTimeout(url, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) break;

      const data = (await res.json()) as {
        items?: ICIMSJob[];
        total?: number;
      };
      const items = data.items ?? [];
      allJobs.push(...items);
      if (items.length === 0) break;
      offset += limit;
    }

    return allJobs.map((job) => ({
      title: this.sanitizeText(job.title),
      organization: company,
      sourceId: source.id,
      sourceUrl: job.apply_url ?? `${apiUrl}/${job.id}`,
      applyLink: job.apply_url ?? null,
      location: this.formatLocation(job.location),
      description: this.stripHtml(job.description),
      requirements: null,
      responsibilities: null,
      deadline: null,
      postedDate: this.parseDate(job.posted_date),
      salary: null,
      eligibility: null,
      type: null,
      workMode: "unknown",
      department: this.sanitizeText(job.department),
      employmentType: this.sanitizeText(job.employment_type),
      tags: [job.department].filter(Boolean),
    }));
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  private formatLocation(
    loc: ICIMSJob["location"] | undefined,
  ): string {
    if (!loc) return "";
    return [loc.city, loc.state, loc.country].filter(Boolean).join(", ");
  }
}
