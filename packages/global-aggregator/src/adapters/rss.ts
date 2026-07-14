import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface RSSItem {
  title: string | null;
  link: string | null;
  description: string | null;
  pubDate: string | null;
  category: string[];
  guid: string | null;
}

export class RSSAdapter extends BaseAdapter {
  readonly type = "rss" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const url =
      source.authentication.credentials?.url ?? source.id;
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) return [];

    const xml = await res.text();
    const items = this.parseFeed(xml);

    return items.map((item) => ({
      title: this.sanitizeText(item.title) || "Untitled",
      organization: this.extractDomain(url),
      sourceId: source.id,
      sourceUrl: url,
      applyLink: item.link,
      location: null,
      description: this.sanitizeText(item.description),
      requirements: null,
      responsibilities: null,
      deadline: null,
      postedDate: this.parseDate(item.pubDate),
      salary: null,
      eligibility: null,
      type: null,
      workMode: "unknown",
      department: null,
      employmentType: null,
      tags: item.category,
    }));
  }

  private parseFeed(xml: string): RSSItem[] {
    const items: RSSItem[] = [];
    const entryPattern =
      /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
    let match: RegExpExecArray | null;

    while ((match = entryPattern.exec(xml)) !== null) {
      const content = match[1];
      items.push({
        title: this.extractTag(content, "title"),
        link: this.extractLink(content),
        description:
          this.extractTag(content, "description") ??
          this.extractTag(content, "summary") ??
          this.extractTag(content, "content"),
        pubDate:
          this.extractTag(content, "pubDate") ??
          this.extractTag(content, "published") ??
          this.extractTag(content, "updated") ??
          this.extractTag(content, "dc:date"),
        category: this.extractAllTags(content, "category"),
        guid: this.extractTag(content, "guid") ?? this.extractTag(content, "id"),
      });
    }

    return items;
  }

  private extractTag(xml: string, tag: string): string | null {
    const re = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i");
    const cdataMatch = xml.match(re);
    if (cdataMatch) return cdataMatch[1].trim();

    const re2 = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
    const match = xml.match(re2);
    return match?.[1]?.trim() ?? null;
  }

  private extractAllTags(xml: string, tag: string): string[] {
    const values: string[] = [];
    const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "gi");
    let match: RegExpExecArray | null;
    while ((match = re.exec(xml)) !== null) {
      const val = match[1].trim();
      if (val) values.push(val);
    }
    return values;
  }

  private extractLink(xml: string): string | null {
    const linkRe = /<link[^>]*>([^<]*)<\/link>/i;
    const linkMatch = xml.match(linkRe);
    if (linkMatch?.[1]) return linkMatch[1].trim();

    const hrefRe = /<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i;
    const hrefMatch = xml.match(hrefRe);
    return hrefMatch?.[1]?.trim() ?? null;
  }
}
