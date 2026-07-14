import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface FieldMapping {
  title?: string;
  organization?: string;
  link?: string;
  applyLink?: string;
  location?: string;
  description?: string;
  postedDate?: string;
  deadline?: string;
  salary?: string;
  department?: string;
  employmentType?: string;
  tags?: string;
}

export class JSONAdapter extends BaseAdapter {
  readonly type = "json" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const url =
      source.authentication.credentials?.url ?? source.id;
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) return [];

    const data: unknown = await res.json();
    const mapping = this.getMapping(source);
    const rootPath = source.authentication.credentials?.rootPath ?? "";
    const items = this.resolvePath(data, rootPath);
    if (!Array.isArray(items)) return [];

    return items.map((item) => this.mapItem(item, mapping, url, source.id));
  }

  private getMapping(source: SourceConfig): FieldMapping {
    const raw = source.authentication.credentials?.fieldMapping;
    if (!raw) return {};
    try {
      return JSON.parse(raw) as FieldMapping;
    } catch {
      return {};
    }
  }

  private resolvePath(data: unknown, path: string): unknown[] {
    if (!path) return Array.isArray(data) ? data : [data];
    const segments = path.split(".").filter(Boolean);
    let current: unknown = data;
    for (const seg of segments) {
      if (current == null || typeof current !== "object") return [];
      current = (current as Record<string, unknown>)[seg];
    }
    return Array.isArray(current) ? current : current != null ? [current] : [];
  }

  private getValue(
    item: Record<string, unknown>,
    fieldPath: string | undefined,
  ): string | null {
    if (!fieldPath) return null;
    const segments = fieldPath.split(".");
    let current: unknown = item;
    for (const seg of segments) {
      if (current == null || typeof current !== "object") return null;
      current = (current as Record<string, unknown>)[seg];
    }
    if (current == null) return null;
    return typeof current === "string" ? current : JSON.stringify(current);
  }

  private mapItem(
    item: unknown,
    mapping: FieldMapping,
    baseUrl: string,
    sourceId: string,
  ): RawScrapedOpportunity {
    const rec = item as Record<string, unknown>;
    const title = this.getValue(rec, mapping.title ?? "title") ?? "Untitled";
    const link = this.getValue(rec, mapping.link ?? "url");
    const applyLink = this.getValue(rec, mapping.applyLink ?? "applyUrl");
    const description = this.getValue(rec, mapping.description ?? "description");
    const postedDate = this.getValue(rec, mapping.postedDate ?? "postedDate");
    const deadline = this.getValue(rec, mapping.deadline ?? "deadline");
    const location = this.getValue(rec, mapping.location ?? "location");
    const department = this.getValue(rec, mapping.department ?? "department");
    const employmentType = this.getValue(
      rec,
      mapping.employmentType ?? "type",
    );
    const salary = this.getValue(rec, mapping.salary ?? "salary");
    const tagsRaw = this.getValue(rec, mapping.tags ?? "tags");
    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    return {
      title: this.sanitizeText(title),
      organization:
        this.getValue(rec, mapping.organization ?? "organization") ??
        this.extractDomain(baseUrl),
      sourceId,
      sourceUrl: link ? this.normalizeUrl(baseUrl, link) : baseUrl,
      applyLink: applyLink ? this.normalizeUrl(baseUrl, applyLink) : null,
      location: this.sanitizeText(location),
      description: this.sanitizeText(description),
      requirements: null,
      responsibilities: null,
      deadline: this.parseDate(deadline),
      postedDate: this.parseDate(postedDate),
      salary: this.sanitizeText(salary),
      eligibility: null,
      type: this.sanitizeText(employmentType),
      workMode: "unknown",
      department: this.sanitizeText(department),
      employmentType: this.sanitizeText(employmentType),
      tags,
    };
  }
}
