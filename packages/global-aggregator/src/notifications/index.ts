import type {
  NormalizedOpportunity,
  NotificationConfig,
  SavedSearch,
  SearchQuery,
} from "../types";

interface NotificationLog {
  id: string;
  timestamp: string;
  userId: string;
  type: "instant" | "digest" | "deadline" | "keyword" | "saved-search";
  message: string;
  data?: Record<string, unknown>;
}

function generateNotificationId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return `notif_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export class NotificationEngine {
  private readonly config: NotificationConfig;
  private readonly log: NotificationLog[] = [];

  constructor(config?: Partial<NotificationConfig>) {
    this.config = {
      email: { enabled: true },
      digest: { enabled: true, frequency: "daily" },
      instantAlerts: { enabled: true },
      savedSearchAlerts: { enabled: true },
      keywordAlerts: { enabled: true },
      deadlineAlerts: { enabled: true, daysBefore: [1, 3, 7, 14, 30] },
      ...config,
    };
  }

  async sendInstantAlert(userId: string, opportunity: NormalizedOpportunity): Promise<void> {
    const entry: NotificationLog = {
      id: generateNotificationId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "instant",
      message: `New opportunity: ${opportunity.title} at ${opportunity.organization}`,
      data: {
        opportunityId: opportunity.id ?? opportunity.hash,
        title: opportunity.title,
        organization: opportunity.organization,
        url: opportunity.canonicalUrl,
        type: opportunity.type,
        country: opportunity.country,
      },
    };

    this.log.push(entry);

    console.log(JSON.stringify({
      event: "notification_instant",
      ...entry,
    }));
  }

  async sendDigest(userId: string, items: NormalizedOpportunity[]): Promise<void> {
    if (items.length === 0) return;

    const entry: NotificationLog = {
      id: generateNotificationId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "digest",
      message: `Digest: ${items.length} new opportunities available`,
      data: {
        count: items.length,
        items: items.map((item) => ({
          id: item.id ?? item.hash,
          title: item.title,
          organization: item.organization,
          type: item.type,
          country: item.country,
        })),
      },
    };

    this.log.push(entry);

    console.log(JSON.stringify({
      event: "notification_digest",
      ...entry,
    }));
  }

  async sendDeadlineAlert(
    userId: string,
    opportunity: NormalizedOpportunity,
    daysRemaining: number,
  ): Promise<void> {
    const entry: NotificationLog = {
      id: generateNotificationId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "deadline",
      message: `Deadline approaching: ${opportunity.title} — ${daysRemaining} day(s) remaining`,
      data: {
        opportunityId: opportunity.id ?? opportunity.hash,
        title: opportunity.title,
        organization: opportunity.organization,
        deadline: opportunity.deadline,
        daysRemaining,
        url: opportunity.canonicalUrl,
      },
    };

    this.log.push(entry);

    console.log(JSON.stringify({
      event: "notification_deadline",
      ...entry,
    }));
  }

  async sendKeywordAlert(
    userId: string,
    keyword: string,
    items: NormalizedOpportunity[],
  ): Promise<void> {
    if (items.length === 0) return;

    const entry: NotificationLog = {
      id: generateNotificationId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "keyword",
      message: `Keyword match "${keyword}": ${items.length} new opportunities`,
      data: {
        keyword,
        count: items.length,
        items: items.map((item) => ({
          id: item.id ?? item.hash,
          title: item.title,
          organization: item.organization,
          type: item.type,
        })),
      },
    };

    this.log.push(entry);

    console.log(JSON.stringify({
      event: "notification_keyword",
      ...entry,
    }));
  }

  async sendSavedSearchAlert(
    userId: string,
    savedSearch: SavedSearch,
    items: NormalizedOpportunity[],
  ): Promise<void> {
    if (items.length === 0) return;

    const entry: NotificationLog = {
      id: generateNotificationId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "saved-search",
      message: `Saved search "${savedSearch.name}" matched ${items.length} new opportunities`,
      data: {
        savedSearchId: savedSearch.id,
        savedSearchName: savedSearch.name,
        query: savedSearch.query,
        count: items.length,
        items: items.map((item) => ({
          id: item.id ?? item.hash,
          title: item.title,
          organization: item.organization,
          type: item.type,
        })),
      },
    };

    this.log.push(entry);

    console.log(JSON.stringify({
      event: "notification_saved_search",
      ...entry,
    }));
  }

  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  getLog(): NotificationLog[] {
    return [...this.log];
  }

  clearLog(): void {
    this.log.length = 0;
  }
}
