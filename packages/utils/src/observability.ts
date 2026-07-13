export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: string;
}

export interface Trace {
  id: string;
  name: string;
  parentId?: string;
  startTime: string;
  endTime?: string;
  tags?: Record<string, string>;
  status: "ok" | "error";
}

export interface ObservabilityProvider {
  recordMetric(metric: Metric): void;
  startTrace(name: string, tags?: Record<string, string>): string;
  endTrace(traceId: string, status?: "ok" | "error"): void;
  recordEvent(name: string, data?: Record<string, unknown>): void;
}

export interface TelemetryProvider {
  trackEvent(category: string, action: string, label?: string, value?: number): void;
  trackPageView(path: string, title?: string): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
}

export const noopObservability: ObservabilityProvider = {
  recordMetric: () => {},
  startTrace: () => "",
  endTrace: () => {},
  recordEvent: () => {},
};

export const noopTelemetry: TelemetryProvider = {
  trackEvent: () => {},
  trackPageView: () => {},
  identify: () => {},
};
