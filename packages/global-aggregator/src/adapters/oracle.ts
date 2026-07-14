import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface OracleJob {
  JobId: string;
  JobTitle: string;
  JobDescription: string;
  LocationName: string;
  Department: string;
  DatePosted: string;
  ApplyUrl: string;
  EmploymentType: string;
  PostedDate: string;
  PrimaryLocation: string;
  JobCategory: string;
}

export class OracleAdapter extends BaseAdapter {
  readonly type = "oracle" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const companyId =
      source.authentication.credentials?.companyId ?? source.id;
    const apiUrl =
      source.authentication.credentials?.apiUrl ??
      `https://apex.oracle.com/pls/apex/hcmRestApi/resources/1.1/recruitingCEJobRequisitions`;

    const allJobs: OracleJob[] = [];
    let offset = 0;
    const limit = 25;

    while (true) {
      const url = `${apiUrl}?onlyData=true&expand=all&limit=${limit}&offset=${offset}&finder=findByCompany;companyName=${companyId}`;
      const res = await this.fetchWithTimeout(url);
      if (!res.ok) break;

      const data = (await res.json()) as {
        items?: OracleJob[];
        total?: number;
      };
      const items = data.items ?? [];
      allJobs.push(...items);
      offset += limit;
      if (offset >= (data.total ?? 0) || items.length === 0) break;
    }

    return allJobs.map((job) => ({
      title: this.sanitizeText(job.JobTitle),
      organization: companyId,
      sourceId: source.id,
      sourceUrl: job.ApplyUrl ?? `${apiUrl}/${job.JobId}`,
      applyLink: job.ApplyUrl ?? null,
      location: this.sanitizeText(
        job.PrimaryLocation || job.LocationName,
      ),
      description: this.sanitizeText(job.JobDescription),
      requirements: null,
      responsibilities: null,
      deadline: null,
      postedDate: this.parseDate(job.PostedDate || job.DatePosted),
      salary: null,
      eligibility: null,
      type: this.sanitizeText(job.JobCategory),
      workMode: "unknown",
      department: this.sanitizeText(job.Department),
      employmentType: this.sanitizeText(job.EmploymentType),
      tags: [job.JobCategory, job.Department].filter(Boolean) as string[],
    }));
  }
}
