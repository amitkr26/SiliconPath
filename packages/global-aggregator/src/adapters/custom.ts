import type {
  AdapterType,
  RawScrapedOpportunity,
  SourceConfig,
} from "../types";
import { BaseAdapter } from "./base";

export interface CustomAdapter extends BaseAdapter {
  readonly type: AdapterType;
  scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]>;
}

export function createCustomAdapter(
  type: AdapterType,
  scrapeFn: (
    source: SourceConfig,
  ) => Promise<RawScrapedOpportunity[]>,
): CustomAdapter {
  return new (class extends BaseAdapter {
    readonly type = type;
    async scrape(source: SourceConfig): Promise<RawScrapedOpportunity[]> {
      return scrapeFn(source);
    }
  })();
}
