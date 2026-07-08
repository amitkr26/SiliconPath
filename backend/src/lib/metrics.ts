export interface Metric {
  name: string;
  help: string;
  type: "counter" | "gauge" | "histogram" | "summary";
  labels?: Record<string, string>;
  value?: number;
  timestamp?: number;
}

const metrics: Metric[] = [];

export function recordScrape(sourceId: string, success: boolean, count: number, tookMs: number) {
  const baseLabels = { source: sourceId, success: success.toString() };

  metrics.push({
    name: "siliconpath_scrapes_total",
    help: "Total scrapes performed",
    type: "counter",
    labels: baseLabels,
    value: 1,
    timestamp: Date.now(),
  });

  metrics.push({
    name: "siliconpath_scrapes_duration_seconds",
    help: "Time taken for a single scrape in seconds",
    type: "histogram",
    labels: baseLabels,
    value: tookMs / 1000,
    timestamp: Date.now(),
  });

  if (success) {
    metrics.push({
      name: "siliconpath_opportunities_found_total",
      help: "Total opportunities found by source",
      type: "counter",
      labels: { source: sourceId },
      value: count,
      timestamp: Date.now(),
    });
  }
}

export function recordActiveRun(sourceId: string, status: string, results?: number, errors?: number) {
  metrics.push({
    name: "siliconpath_active_scrapes",
    help: "Number of currently active scrapes",
    type: "gauge",
    labels: { source: sourceId, status },
    value: status === "running" ? 1 : 0,
    timestamp: Date.now(),
  });

  if (status === "completed" && results !== undefined) {
    metrics.push({
      name: "siliconpath_scrape_results_total",
      help: "Results count per source per scrape",
      type: "summary",
      labels: { source: sourceId },
      value: results,
      timestamp: Date.now(),
    });
  }
}

export function getMetricsPrometheusFormat(): string {
  const lines: string[] = [];
  const now = Date.now() / 1000;

  const grouped: Record<string, Metric[]> = {};
  for (const m of metrics) {
    if (!grouped[m.name]) grouped[m.name] = [];
    grouped[m.name].push(m);
  }

  for (const name of Object.keys(grouped)) {
    const seen = new Set<string>();
    for (const metric of grouped[name]) {
      const labelStr = metric.labels
        ? `{${Object.entries(metric.labels).map(([k, v]) => `${k}="${v}"`).join(",")}}`
        : "";
      const key = `${name}${labelStr}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const value = metric.value ?? 0;
      const timestamp = metric.timestamp ?? Math.floor(now);
      lines.push(`${name}${labelStr} ${value} ${timestamp}`);
    }
  }

  if (lines.length === 0) return "# No metrics available\n";

  const header = [
    "# HELP siliconpath_scrapes_total Total scrapes performed",
    "# TYPE siliconpath_scrapes_total counter",
    "# HELP siliconpath_scrapes_duration_seconds Time taken for a single scrape in seconds",
    "# TYPE siliconpath_scrapes_duration_seconds histogram",
    "# HELP siliconpath_opportunities_found_total Total opportunities found by source",
    "# TYPE siliconpath_opportunities_found_total counter",
    "# HELP siliconpath_active_scrapes Number of currently active scrapes",
    "# TYPE siliconpath_active_scrapes gauge",
    "# HELP siliconpath_scrape_results_total Results count per source per scrape",
    "# TYPE siliconpath_scrape_results_total summary",
    `siliconpath_uptime_seconds ${now} ${Math.floor(now)}`,
  ];

  return ["# Prometheus Metrics from SiliconPath Scraper", ...header, ...lines].join("\n") + "\n";
}