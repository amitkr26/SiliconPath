export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
}

export interface PageViewEvent {
  path: string;
  title?: string;
  referrer?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
}

export interface AnalyticsProvider {
  trackEvent(event: AnalyticsEvent): Promise<void>;
  trackPageView(event: PageViewEvent): Promise<void>;
  identify(userId: string, traits?: Record<string, unknown>): Promise<void>;
}

export interface AnalyticsQuery {
  eventName: string;
  startDate: string;
  endDate: string;
  groupBy?: string;
  filters?: Record<string, unknown>;
}

export interface AnalyticsResult {
  eventName: string;
  period: { start: string; end: string };
  totalCount: number;
  uniqueUsers: number;
  groups?: Array<{ key: string; count: number }>;
}

export const noopAnalytics: AnalyticsProvider = {
  trackEvent: async () => {},
  trackPageView: async () => {},
  identify: async () => {},
};
