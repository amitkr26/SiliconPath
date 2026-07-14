import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

export class XMLAdapter extends BaseAdapter {
  readonly type = "xml" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const url =
      source.authentication.credentials?.url ?? source.id;
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) return [];

    const xml = await res.text();
    return this.parseXml(xml, url, source.id);
  }

  private parseXml(
    xml: string,
    baseUrl: string,
    sourceId: string,
  ): RawScrapedOpportunity[] {
    const results: RawScrapedOpportunity[] = [];

    const itemRe =
      /<(?:item|job|posting|listing|opening|record|entry|position)[\s>]([\s\S]*?)<\/(?:item|job|posting|listing|opening|record|entry|position)>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRe.exec(xml)) !== null) {
      const block = match[1];
      const title =
        this.extractTag(block, "title") ??
        this.extractTag(block, "name") ??
        this.extractTag(block, "jobTitle") ??
        "Untitled";
      const link =
        this.extractTag(block, "link") ??
        this.extractTag(block, "url") ??
        this.extractTag(block, "applyUrl") ??
        this.extractTag(block, "href") ??
        null;
      const description =
        this.extractTag(block, "description") ??
        this.extractTag(block, "content") ??
        this.extractTag(block, "summary") ??
        this.extractTag(block, "details") ??
        null;
      const postedDate =
        this.extractTag(block, "pubDate") ??
        this.extractTag(block, "postedDate") ??
        this.extractTag(block, "created") ??
        this.extractTag(block, "publishDate") ??
        null;
      const location =
        this.extractTag(block, "location") ??
        this.extractTag(block, "city") ??
        this.extractTag(block, "region") ??
        null;
      const department =
        this.extractTag(block, "department") ??
        this.extractTag(block, "team") ??
        null;
      const employmentType =
        this.extractTag(block, "type") ??
        this.extractTag(block, "employmentType") ??
        this.extractTag(block, "workType") ??
        null;

      results.push({
        title: this.sanitizeText(title),
        organization: this.extractDomain(baseUrl),
        sourceId,
        sourceUrl: baseUrl,
        applyLink: link ? this.normalizeUrl(baseUrl, link) : null,
        location: this.sanitizeText(location),
        description: this.sanitizeText(description),
        requirements: null,
        responsibilities: null,
        deadline: null,
        postedDate: this.parseDate(postedDate),
        salary: null,
        eligibility: null,
        type: this.sanitizeText(employmentType),
        workMode: "unknown",
        department: this.sanitizeText(department),
        employmentType: this.sanitizeText(employmentType),
        tags: [department].filter(Boolean) as string[],
      });
    }

    return results;
  }

  private extractTag(xml: string, tag: string): string | null {
    const cdataRe = new RegExp(
      `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
      "i",
    );
    const cdataMatch = xml.match(cdataRe);
    if (cdataMatch) return cdataMatch[1].trim();

    const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
    const match = xml.match(re);
    return match?.[1]?.trim() ?? null;
  }
}
