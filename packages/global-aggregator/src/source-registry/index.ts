import type {
  SourceConfig,
  ClassificationLabel,
  AdapterType,
  SourceStatus,
  SourceHealth,
} from "../types";
import { sources } from "./sources";

export { CATEGORY_META } from "./categories";
export { sources } from "./sources";
export class SourceRegistry {
  private readonly sources: Map<string, SourceConfig>;

  constructor(entries: SourceConfig[]) {
    this.sources = new Map(entries.map((s) => [s.id, s]));
  }

  get(id: string): SourceConfig | undefined {
    return this.sources.get(id);
  }

  getAll(): SourceConfig[] {
    return Array.from(this.sources.values());
  }

  getByCategory(category: ClassificationLabel): SourceConfig[] {
    return this.getAll().filter((s) => s.category === category);
  }

  getByAdapter(adapter: AdapterType): SourceConfig[] {
    return this.getAll().filter((s) => s.adapter === adapter);
  }

  getByStatus(status: SourceStatus): SourceConfig[] {
    return this.getAll().filter((s) => s.status === status);
  }

  getByBatch(batchId: number): SourceConfig[] {
    return this.getAll().filter((s) => s.scheduling.batchId === batchId);
  }

  getByHealth(health: SourceHealth): SourceConfig[] {
    return this.getAll().filter((s) => s.health === health);
  }

  getActive(): SourceConfig[] {
    return this.getByStatus("active");
  }

  search(query: string): SourceConfig[] {
    const q = query.toLowerCase();
    return this.getAll().filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.notes.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    );
  }

  size(): number {
    return this.sources.size;
  }

  update(id: string, partial: Partial<SourceConfig>): SourceConfig | undefined {
    const existing = this.sources.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...partial, id: existing.id };
    this.sources.set(id, updated);
    return updated;
  }

  getCategories(): ClassificationLabel[] {
    const cats = new Set<ClassificationLabel>();
    for (const s of this.sources.values()) {
      cats.add(s.category);
    }
    return Array.from(cats);
  }
}

export const sourceRegistry = new SourceRegistry(sources);
