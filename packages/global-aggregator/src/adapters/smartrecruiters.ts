import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface SmartRecruitersPosting {
  id: string;
  name: string;
  releasedDate: string;
  jobId: string;
  position: {
    name: string;
    level: string;
    family: string;
  };
  location: { city: string; region: string; country: string; remote: boolean };
  internal: boolean;
  ref: string;
  department: { name: string };
  about: string;
  experience: string;
  education: string;
  compensation: { min: number; max: number; currency: string };
  applyUrl: string;
}

interface SmartRecruitersResponse {
  content: SmartRecruitersPosting[];
  total: number;
  count: number;
  totalPages: number;
}

export class SmartRecruitersAdapter extends BaseAdapter {
  readonly type = "smartrecruiters" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const company =
      source.authentication.credentials?.company ?? source.id;
    const results: SmartRecruitersPosting[] = [];
    let page = 0;

    while (true) {
      const url = `https://api.smartrecruiters.com/v1/companies/${company}/postings?limit=100&offset=${page * 100}`;
      const res = await this.fetchWithTimeout(url);
      if (!res.ok) break;

      const data: SmartRecruitersResponse = await res.json();
      results.push(...data.content);
      if (data.content.length === 0 || page + 1 >= data.totalPages) break;
      page++;
    }

    return results.map((job) => ({
      title: this.sanitizeText(job.name),
      organization: company,
      sourceId: source.id,
      sourceUrl: `https://careers.smartrecruiters.com/${company}/${job.ref}`,
      applyLink: job.applyUrl,
      location: this.formatLocation(job.location),
      description: this.sanitizeText(job.about),
      requirements: this.sanitizeText(job.experience),
      responsibilities: null,
      deadline: null,
      postedDate: this.parseDate(job.releasedDate),
      salary: job.compensation
        ? `${job.compensation.min}-${job.compensation.max} ${job.compensation.currency}`
        : null,
      eligibility: this.sanitizeText(job.education),
      type: null,
      workMode: job.location?.remote ? "remote" : "unknown",
      department: job.department?.name ?? null,
      employmentType: this.sanitizeText(job.position?.level),
      tags: [job.department?.name, job.position?.family].filter(
        Boolean,
      ) as string[],
    }));
  }

  private formatLocation(loc: SmartRecruitersPosting["location"]): string {
    if (!loc) return "";
    return [loc.city, loc.region, loc.country].filter(Boolean).join(", ");
  }
}
