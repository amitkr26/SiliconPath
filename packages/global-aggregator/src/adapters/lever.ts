import type { RawScrapedOpportunity, SourceConfig } from "../types";
import { BaseAdapter } from "./base";

interface LeverPosting {
  id: string;
  text: string;
  descriptionPlain: string;
  categories: {
    team: string;
    department: string;
    location: string;
  };
  createdAt: number;
  hostedUrl: string;
  applyUrl: string;
  followerUrl?: string;
  metadata?: Array<{ id: string; name: string; value: string }>;
}

export class LeverAdapter extends BaseAdapter {
  readonly type = "lever" as const;

  async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
    const board =
      source.authentication.credentials?.board ?? source.id;
    const url = `https://api.lever.co/v0/postings/${board}?mode=json`;
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) return [];

    const postings: LeverPosting[] = await res.json();

    return postings.map((post) => ({
      title: this.sanitizeText(post.text),
      organization: board,
      sourceId: source.id,
      sourceUrl: post.hostedUrl,
      applyLink: post.applyUrl ?? post.hostedUrl,
      location: this.sanitizeText(post.categories?.location),
      description: this.sanitizeText(post.descriptionPlain),
      requirements: null,
      responsibilities: null,
      deadline: null,
      postedDate: this.parseDate(
        post.createdAt ? new Date(post.createdAt * 1000).toISOString() : null,
      ),
      salary: null,
      eligibility: null,
      type: null,
      workMode: "unknown",
      department: this.sanitizeText(post.categories?.department),
      employmentType: null,
      tags: [post.categories?.team, post.categories?.department].filter(
        Boolean,
      ) as string[],
    }));
  }
}
