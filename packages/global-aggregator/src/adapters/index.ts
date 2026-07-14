import type { AdapterType, SourceConfig } from "../types";
import { AshbyAdapter } from "./ashby";
import { BambooHRAdapter } from "./bamboohr";
import { BaseAdapter } from "./base";
import { ComeetAdapter } from "./comeet";
import { createCustomAdapter } from "./custom";
import { GreenhouseAdapter } from "./greenhouse";
import { HTMLAdapter } from "./html";
import { ICIMSAdapter } from "./icims";
import { JSONAdapter } from "./json";
import { JobviteAdapter } from "./jobvite";
import { LeverAdapter } from "./lever";
import { OracleAdapter } from "./oracle";
import { RecruiteeAdapter } from "./recruitee";
import { RSSAdapter } from "./rss";
import { SchemaAdapter } from "./schema";
import { SmartRecruitersAdapter } from "./smartrecruiters";
import { SuccessFactorsAdapter } from "./successfactors";
import { TeamtailorAdapter } from "./teamtailor";
import { WorkdayAdapter } from "./workday";
import { XMLAdapter } from "./xml";

export { BaseAdapter } from "./base";
export { AshbyAdapter } from "./ashby";
export { BambooHRAdapter } from "./bamboohr";
export { ComeetAdapter } from "./comeet";
export { createCustomAdapter, type CustomAdapter } from "./custom";
export { GreenhouseAdapter } from "./greenhouse";
export { HTMLAdapter } from "./html";
export { ICIMSAdapter } from "./icims";
export { JSONAdapter } from "./json";
export { JobviteAdapter } from "./jobvite";
export { LeverAdapter } from "./lever";
export { OracleAdapter } from "./oracle";
export { RecruiteeAdapter } from "./recruitee";
export { RSSAdapter } from "./rss";
export { SchemaAdapter } from "./schema";
export { SmartRecruitersAdapter } from "./smartrecruiters";
export { SuccessFactorsAdapter } from "./successfactors";
export { TeamtailorAdapter } from "./teamtailor";
export { WorkdayAdapter } from "./workday";
export { XMLAdapter } from "./xml";

export class AdapterFactory {
  private adapters = new Map<AdapterType, BaseAdapter>();

  constructor() {
    this.register(new GreenhouseAdapter());
    this.register(new LeverAdapter());
    this.register(new WorkdayAdapter());
    this.register(new SmartRecruitersAdapter());
    this.register(new SuccessFactorsAdapter());
    this.register(new OracleAdapter());
    this.register(new AshbyAdapter());
    this.register(new BambooHRAdapter());
    this.register(new ICIMSAdapter());
    this.register(new JobviteAdapter());
    this.register(new TeamtailorAdapter());
    this.register(new RecruiteeAdapter());
    this.register(new ComeetAdapter());
    this.register(new HTMLAdapter());
    this.register(new RSSAdapter());
    this.register(new SchemaAdapter());
    this.register(new XMLAdapter());
    this.register(new JSONAdapter());
    this.register(
      createCustomAdapter("custom", async () => []),
    );
  }

  register(adapter: BaseAdapter): void {
    this.adapters.set(adapter.type, adapter);
  }

  get(type: AdapterType): BaseAdapter | null {
    return this.adapters.get(type) ?? null;
  }

  getForSource(source: SourceConfig): BaseAdapter | null {
    return this.get(source.adapter);
  }

  getAll(): BaseAdapter[] {
    return [...this.adapters.values()];
  }

  getSupportedTypes(): AdapterType[] {
    return [...this.adapters.keys()];
  }
}
