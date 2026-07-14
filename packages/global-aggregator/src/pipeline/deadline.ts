const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const ROLLING_PATTERNS = [
  /rolling/i,
  /ongoing/i,
  /open\s+until\s+filled/i,
  /open\s+until/i,
  /no\s+deadline/i,
  /continuous/i,
  /until\s+filled/i,
  /till\s+filled/i,
  /open/i,
  /no\s+fixed/i,
];

export class DeadlineNormalizer {
  normalize(
    deadline: string | null,
    postedDate?: string | null,
  ): string | null {
    if (!deadline) return null;

    const trimmed = deadline.trim();

    for (const pattern of ROLLING_PATTERNS) {
      if (pattern.test(trimmed)) return null;
    }

    const isoMatch = trimmed.match(
      /(\d{4})-(\d{2})-(\d{2})(?:T[\d:.]+Z?)?/,
    );
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      const date = new Date(`${y}-${m}-${d}`);
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }

    const usMatch = trimmed.match(
      /(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/,
    );
    if (usMatch) {
      const [, m, d, y] = usMatch;
      const date = new Date(
        `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`,
      );
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }

    const textDate = this.parseTextDate(trimmed);
    if (textDate) return textDate;

    const relative = this.parseRelativeDate(trimmed, postedDate);
    if (relative) return relative;

    const generic = new Date(trimmed);
    if (!Number.isNaN(generic.getTime())) return generic.toISOString();

    return null;
  }

  private parseTextDate(text: string): string | null {
    const longDate = text.match(
      /(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i,
    );
    if (longDate) {
      const [, d, mon, y] = longDate;
      const monthIdx = MONTHS[mon.toLowerCase()];
      if (monthIdx !== undefined) {
        const date = new Date(
          Number(y),
          monthIdx,
          Number(d),
        );
        if (!Number.isNaN(date.getTime())) return date.toISOString();
      }
    }

    const monthFirst = text.match(
      /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})/i,
    );
    if (monthFirst) {
      const [, mon, d, y] = monthFirst;
      const monthIdx = MONTHS[mon.toLowerCase()];
      if (monthIdx !== undefined) {
        const date = new Date(
          Number(y),
          monthIdx,
          Number(d),
        );
        if (!Number.isNaN(date.getTime())) return date.toISOString();
      }
    }

    const monthYear = text.match(
      /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i,
    );
    if (monthYear) {
      const [, mon, y] = monthYear;
      const monthIdx = MONTHS[mon.toLowerCase()];
      if (monthIdx !== undefined) {
        const date = new Date(Number(y), monthIdx, 28);
        if (!Number.isNaN(date.getTime())) return date.toISOString();
      }
    }

    return null;
  }

  private parseRelativeDate(
    text: string,
    postedDate?: string | null,
  ): string | null {
    const base = postedDate ? new Date(postedDate) : new Date();
    if (Number.isNaN(base.getTime())) return null;

    const daysMatch = text.match(/(\d+)\s+days?\s+from\s+(?:publication|posted|post)/i);
    if (daysMatch) {
      const ms = Number(daysMatch[1]) * 86_400_000;
      return new Date(base.getTime() + ms).toISOString();
    }

    const weeksMatch = text.match(/(\d+)\s+weeks?\s+from\s+(?:publication|posted|post)/i);
    if (weeksMatch) {
      const ms = Number(weeksMatch[1]) * 7 * 86_400_000;
      return new Date(base.getTime() + ms).toISOString();
    }

    const monthsMatch = text.match(/(\d+)\s+months?\s+from\s+(?:publication|posted|post)/i);
    if (monthsMatch) {
      const date = new Date(base);
      date.setMonth(date.getMonth() + Number(monthsMatch[1]));
      return date.toISOString();
    }

    return null;
  }
}
