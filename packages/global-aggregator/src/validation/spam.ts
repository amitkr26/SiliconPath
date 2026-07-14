import type { NormalizedOpportunity } from "../types";

interface SpamResult {
  spam: boolean;
  reasons: string[];
}

const SPAM_DOMAINS = new Set([
  "spam.com",
  "scam.com",
  "fakejobs.com",
  "jobscam.com",
  "workfromhomescam.com",
]);

export class SpamDetector {
  isSpam(item: Partial<NormalizedOpportunity>): SpamResult {
    const reasons: string[] = [];

    if (item.title) {
      const title = item.title.trim();

      if (title.length > 0 && title === title.toUpperCase() && title.length > 5) {
        reasons.push("Title is entirely uppercase");
      }

      const punctuationCount = (title.match(/[!?]{2,}/g) ?? []).length;
      if (punctuationCount > 0) {
        reasons.push("Excessive punctuation in title");
      }

      const keywords = [
        "urgent",
        "urgent hiring",
        "immediate opening",
        "work from home",
        "earn money",
        "easy money",
        "guaranteed",
        "100%",
        "no experience needed",
        "click here",
        "act now",
        "limited time",
        "free money",
        "make money fast",
      ];

      const lowerTitle = title.toLowerCase();
      let keywordCount = 0;
      for (const kw of keywords) {
        if (lowerTitle.includes(kw)) keywordCount++;
      }
      if (keywordCount >= 3) {
        reasons.push("Excessive spam keywords in title");
      }
    }

    if (item.description) {
      const desc = item.description;

      const words = desc.split(/\s+/);
      if (words.length > 10) {
        const wordFreq = new Map<string, number>();
        for (const word of words) {
          const lower = word.toLowerCase();
          if (lower.length > 3) {
            wordFreq.set(lower, (wordFreq.get(lower) ?? 0) + 1);
          }
        }

        for (const [word, count] of wordFreq) {
          if (count > words.length * 0.05 && count > 5) {
            reasons.push(`Repeated word: "${word}" (${count} times)`);
            break;
          }
        }
      }

      if (desc.length > 100) {
        const ratio =
          (desc.match(/[A-Z]/g) ?? []).length / desc.length;
        if (ratio > 0.6) {
          reasons.push("Description is mostly uppercase");
        }
      }

      const hasGibberish =
        /([a-z])\1{7,}/i.test(desc) ||
        /[^\w\s.,!?;:'"()\-/]{5,}/.test(desc);
      if (hasGibberish) {
        reasons.push("Description contains gibberish patterns");
      }
    }

    if (item.sourceUrl) {
      try {
        const hostname = new URL(item.sourceUrl).hostname.toLowerCase();
        for (const domain of SPAM_DOMAINS) {
          if (hostname.includes(domain)) {
            reasons.push(`Known spam domain: ${domain}`);
            break;
          }
        }
      } catch {
        reasons.push("Invalid source URL");
      }
    }

    if (item.organization) {
      const org = item.organization.toLowerCase();
      if (org.length > 200) {
        reasons.push("Organization name is suspiciously long");
      }
    }

    return {
      spam: reasons.length >= 2,
      reasons,
    };
  }
}
