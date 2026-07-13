import type { TelemetryEvent, ProviderName } from "../types";

const MAX_EVENTS = 10_000;

function matchesFilter(event: TelemetryEvent, filters: Partial<TelemetryEvent>): boolean {
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    const eventValue = (event as unknown as Record<string, unknown>)[key];
    if (eventValue !== value) return false;
  }
  return true;
}

class TelemetryCollector {
  private events: TelemetryEvent[] = [];

  record(event: TelemetryEvent): void {
    if (this.events.length >= MAX_EVENTS) {
      this.events.shift();
    }
    this.events.push(event);
  }

  getEvents(filters?: Partial<TelemetryEvent>): TelemetryEvent[] {
    if (!filters) return [...this.events];
    return this.events.filter((event) => matchesFilter(event, filters));
  }

  getEventsInRange(startTime: number, endTime: number): TelemetryEvent[] {
    return this.events.filter(
      (event) => event.timestamp >= startTime && event.timestamp <= endTime,
    );
  }

  getRecentEvents(count: number): TelemetryEvent[] {
    if (count <= 0) return [];
    return this.events.slice(-count);
  }

  clear(): void {
    this.events = [];
  }

  async flush(): Promise<void> {
    const count = this.events.length;
    if (count === 0) return;
    console.log(
      JSON.stringify({
        level: "info",
        message: "[Telemetry] Flushing events",
        count,
        events: this.events,
      }),
    );
  }

  getEventCount(): number {
    return this.events.length;
  }
}

export const telemetry = new TelemetryCollector();
export { TelemetryCollector };
