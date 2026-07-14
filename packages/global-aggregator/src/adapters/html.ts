import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

const JOB_LINK_PATTERNS =
  /href=["']([^"']*(?:job|career|position|opening|vacancy|requisition)[^"']*)["']/gi;
const ANCHOR_RE =
  /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*(?:engineer|developer|scientist|analyst|manager|lead|architect|researcher|intern|fellow|phd|postdoc|assistant|director|specialist|advisor|consultant|technician|designer|architect|officer|administrator|coordinator|manager|supervisor)[^<]*)<\/a>/gi;
const TITLE_RE = /<title[^>]*>([^<]+)<\/title>/i;
const META_DESC_RE =
  /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i;

export class HTMLAdapter extends BaseAdapter {
  readonly type = "html" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const url =
      source.authentication.credentials?.url ?? source.id;
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) return [];

    const html = await res.text();
    return this.parseHtml(html, url, source.id);
  }

  private parseHtml(
    html: string,
    baseUrl: string,
    sourceId: string,
  ): RawScrapedOpportunity[] {
    const results: RawScrapedOpportunity[] = [];
    const seen = new Set<string>();
    const titleMatch = html.match(TITLE_RE);
    const pageTitle = titleMatch?.[1]?.trim() ?? null;

    const anchorRe = new RegExp(ANCHOR_RE.source, "gi");
    let match: RegExpExecArray | null;

    while ((match = anchorRe.exec(html)) !== null) {
      const rawHref = match[1].trim();
      const linkText = match[2].trim();
      const href = this.normalizeUrl(baseUrl, rawHref);
      if (seen.has(href)) continue;
      seen.add(href);

      const block = this.extractSurroundingContext(html, match.index, 800);
      const desc = this.stripTags(block);

      results.push({
        title: linkText || pageTitle || "Untitled",
        organization: this.extractDomain(baseUrl),
        sourceId,
        sourceUrl: baseUrl,
        applyLink: href,
        location: this.guessLocation(block),
        description: desc,
        requirements: null,
        responsibilities: null,
        deadline: null,
        postedDate: null,
        salary: null,
        eligibility: null,
        type: null,
        workMode: "unknown",
        department: null,
        employmentType: null,
        tags: this.extractTags(block),
      });
    }

    if (results.length === 0) {
      const linkRe = new RegExp(JOB_LINK_PATTERNS.source, "gi");
      let linkMatch: RegExpExecArray | null;
      while ((linkMatch = linkRe.exec(html)) !== null) {
        const rawHref = linkMatch[1].trim();
        if (rawHref.startsWith("#") || rawHref.startsWith("javascript:"))
          continue;
        const href = this.normalizeUrl(baseUrl, rawHref);
        if (seen.has(href)) continue;
        seen.add(href);

        const linkLabel = this.guessLinkLabel(html, linkMatch.index);

        results.push({
          title: linkLabel || pageTitle || "Untitled",
          organization: this.extractDomain(baseUrl),
          sourceId,
          sourceUrl: baseUrl,
          applyLink: href,
          location: null,
          description: null,
          requirements: null,
          responsibilities: null,
          deadline: null,
          postedDate: null,
          salary: null,
          eligibility: null,
          type: null,
          workMode: "unknown",
          department: null,
          employmentType: null,
          tags: [],
        });
      }
    }

    return results;
  }

  private extractSurroundingContext(
    html: string,
    index: number,
    radius: number,
  ): string {
    const start = Math.max(0, index - radius);
    const end = Math.min(html.length, index + radius);
    return html.slice(start, end);
  }

  private stripTags(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  private guessLocation(text: string): string | null {
    const cityRe =
      /\b(?:bangalore|bengaluru|mumbai|delhi|hyderabad|chennai|pune|gurgaon|noida|san jose|mountain view|austin|seattle|new york|london|berlin|tokyo|singapore|toronto|bangalore)\b/i;
    const match = text.match(cityRe);
    return match?.[0] ?? null;
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const deptRe =
      /\b(?:engineering|product|design|marketing|sales|operations|finance|hr|data|research|devops|qa|security|infrastructure|platform)\b/gi;
    let m: RegExpExecArray | null;
    while ((m = deptRe.exec(text)) !== null) {
      const tag = m[0].toLowerCase();
      if (!tags.includes(tag)) tags.push(tag);
    }
    return tags;
  }

  private guessLinkLabel(html: string, anchorIndex: number): string {
    const snippet = html.slice(
      Math.max(0, anchorIndex - 50),
      Math.min(html.length, anchorIndex + 200),
    );
    const textRe = />([^<]+)</g;
    let best = "";
    let m: RegExpExecArray | null;
    while ((m = textRe.exec(snippet)) !== null) {
      const val = m[1].trim();
      if (val.length > best.length && val.length < 200) best = val;
    }
    return best;
  }
}
