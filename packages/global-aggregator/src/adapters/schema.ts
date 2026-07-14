import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface LDJobPosting {
  "@type": "JobPosting";
  title: string;
  description?: string;
  datePosted?: string;
  validThrough?: string;
  employmentType?: string;
  hiringOrganization?: {
    "@type": "Organization";
    name?: string;
  } | string;
  jobLocation?: {
    "@type": "Place";
    address?: {
      "@type": "PostalAddress";
      addressLocality?: string;
      addressRegion?: string;
      addressCountry?: string;
    };
  } | string;
  baseSalary?: {
    "@type": "MonetaryAmount";
    currency?: string;
    value?: {
      "@type": "QuantitativeValue";
      minValue?: number;
      maxValue?: number;
      unitText?: string;
    };
  };
}

export class SchemaAdapter extends BaseAdapter {
  readonly type = "schema" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const url =
      source.authentication.credentials?.url ?? source.id;
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) return [];

    const html = await res.text();
    const jobs = this.extractJobPostings(html);
    const domain = this.extractDomain(url);

    return jobs.map((job) => {
      const location = this.resolveLocation(job);
      const salary = this.resolveSalary(job);
      const orgName =
        typeof job.hiringOrganization === "string"
          ? job.hiringOrganization
          : job.hiringOrganization?.name ?? domain;

      return {
        title: this.sanitizeText(job.title),
        organization: this.sanitizeText(orgName),
        sourceId: source.id,
        sourceUrl: url,
        applyLink: url,
        location,
        description: this.sanitizeText(job.description)
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
        requirements: null,
        responsibilities: null,
        deadline: this.parseDate(job.validThrough),
        postedDate: this.parseDate(job.datePosted),
        salary,
        eligibility: null,
        type: this.sanitizeText(job.employmentType),
        workMode: location?.toLowerCase().includes("remote")
          ? "remote"
          : "unknown",
        department: null,
        employmentType: this.sanitizeText(job.employmentType),
        tags: [],
      };
    });
  }

  private extractJobPostings(html: string): LDJobPosting[] {
    const results: LDJobPosting[] = [];
    const jsonLdRe =
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;

    while ((match = jsonLdRe.exec(html)) !== null) {
      try {
        const data: unknown = JSON.parse(match[1]);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (this.isJobPosting(item)) {
            results.push(item);
          } else if (
            item &&
            typeof item === "object" &&
            "@graph" in item &&
            Array.isArray((item as Record<string, unknown>)["@graph"])
          ) {
            for (const graphItem of (item as { "@graph": unknown[] })[
              "@graph"
            ]) {
              if (this.isJobPosting(graphItem)) {
                results.push(graphItem);
              }
            }
          }
        }
      } catch {
        continue;
      }
    }

    return results;
  }

  private isJobPosting(obj: unknown): obj is LDJobPosting {
    return (
      typeof obj === "object" &&
      obj !== null &&
      "@type" in obj &&
      (obj as Record<string, unknown>)["@type"] === "JobPosting"
    );
  }

  private resolveLocation(job: LDJobPosting): string {
    if (typeof job.jobLocation === "string") return job.jobLocation;
    const addr = job.jobLocation?.address;
    if (!addr) return "";
    return [
      addr.addressLocality,
      addr.addressRegion,
      addr.addressCountry,
    ]
      .filter(Boolean)
      .join(", ");
  }

  private resolveSalary(job: LDJobPosting): string | null {
    if (!job.baseSalary) return null;
    const val = job.baseSalary.value;
    if (!val) return null;
    const currency = job.baseSalary.currency ?? "";
    if (val.minValue !== undefined && val.maxValue !== undefined) {
      return `${currency} ${val.minValue}-${val.maxValue} ${val.unitText ?? ""}`.trim();
    }
    const valValue = (val as Record<string, unknown>).value;
    if (valValue !== undefined) {
      return `${currency} ${valValue} ${val.unitText ?? ""}`.trim();
    }
    return null;
  }
}
