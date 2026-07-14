import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface SuccessFactorsJob {
  title: string;
  jobId: string;
  jobRequisitionId: string;
  city: string;
  country: string;
  location: string;
  department: string;
  postedDate: string;
  applyUrl: string;
  jobDescription: string;
  employmentType: string;
  seniority: string;
}

export class SuccessFactorsAdapter extends BaseAdapter {
  readonly type = "successfactors" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const companyId =
      source.authentication.credentials?.companyId ?? source.id;
    const url =
      source.authentication.credentials?.apiUrl ??
      `https://api.wd12.myworkdayjobs.com/wday/cxs/${companyId}/External`;
    const res = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 20, offset: 0, searchText: "" }),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      jobPostings?: SuccessFactorsJob[];
      total?: number;
    };
    const postings = data.jobPostings ?? [];

    const allJobs: SuccessFactorsJob[] = [...postings];
    const total = data.total ?? 0;
    let offset = 20;

    while (offset < total) {
      const pageRes = await this.fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 20, offset, searchText: "" }),
      });
      if (!pageRes.ok) break;
      const pageData = (await pageRes.json()) as {
        jobPostings?: SuccessFactorsJob[];
      };
      const items = pageData.jobPostings ?? [];
      allJobs.push(...items);
      if (items.length === 0) break;
      offset += 20;
    }

    return allJobs.map((job) => ({
      title: this.sanitizeText(job.title),
      organization: companyId,
      sourceId: source.id,
      sourceUrl: job.applyUrl ?? `${url}/job/${job.jobId}`,
      applyLink: job.applyUrl ?? null,
      location: this.sanitizeText(job.location || job.city),
      description: this.sanitizeText(job.jobDescription),
      requirements: null,
      responsibilities: null,
      deadline: null,
      postedDate: this.parseDate(job.postedDate),
      salary: null,
      eligibility: null,
      type: this.sanitizeText(job.seniority),
      workMode: "unknown",
      department: this.sanitizeText(job.department),
      employmentType: this.sanitizeText(job.employmentType),
      tags: [job.department, job.seniority].filter(Boolean) as string[],
    }));
  }
}
