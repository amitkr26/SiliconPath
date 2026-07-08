import { SOURCES } from "../scrapers/orchestrator.js";

interface SourceInfo {
  id: string;
  name: string;
  url: string;
  category: string;
  batch: number;
  type: string;
  active: boolean;
}

interface CategoryStats {
  category: string;
  sources: number;
  activeSources: number;
}

interface BatchStats {
  batch: number;
  sources: number;
  activeSources: number;
  adapterTypes?: Record<string, number>;
}

export function getAllSources(): SourceInfo[] {
  return SOURCES.map((s) => ({ id: s.id, name: s.name, url: s.url, category: s.category, batch: s.batch, type: s.type, active: s.active }));
}

export function getActiveSourcesByCategory(): CategoryStats[] {
  const categories: Record<string, { sources: number; activeSources: number }> = {};
  for (const source of SOURCES) {
    if (!categories[source.category]) {
      categories[source.category] = { sources: 0, activeSources: 0 };
    }
    categories[source.category].sources++;
    if (source.active) categories[source.category].activeSources++;
  }

  return Object.entries(categories).map(([category, stats]) => ({
    category,
    sources: stats.sources,
    activeSources: stats.activeSources,
  }));
}

export function getBatchesByCategory(): BatchStats[] {
  const batches: Record<string, { batch: number; total: number; active: number }> = {};
  for (const source of SOURCES) {
    if (!batches[source.batch]) {
      batches[source.batch] = { batch: source.batch, total: 0, active: 0 };
    }
    batches[source.batch].total++;
    if (source.active) batches[source.batch].active++;
  }

  return Object.values(batches).map((batch) => {
    const batchSources = SOURCES.filter((s) => s.batch === batch.batch);
    const adapterTypes: Record<string, number> = {};
    for (const s of batchSources) {
      adapterTypes[s.type] = (adapterTypes[s.type] || 0) + 1;
    }
    return {
      batch: batch.batch,
      sources: batch.total,
      activeSources: batch.active,
      adapterTypes,
    };
  });
}

export function getAdapterTypeCategories(): Record<string, string[]> {
  const adapterCategories: Record<string, string[]> = {};
  for (const source of SOURCES) {
    if (!adapterCategories[source.type]) adapterCategories[source.type] = [];
    adapterCategories[source.type].push(source.category);
  }
  return adapterCategories;
}

export function getSourceById(id: string): SourceInfo | null {
  const source = SOURCES.find((s) => s.id === id);
  if (!source) return null;
  return {
    id: source.id,
    name: source.name,
    url: source.url,
    category: source.category,
    batch: source.batch,
    type: source.type,
    active: source.active,
  };
}

export function getAPIInfo() {
  const batches: Record<string, number> = {};
  for (const source of SOURCES) {
    if (source.active) {
      batches[source.batch.toString()] = (batches[source.batch.toString()] || 0) + 1;
    }
  }

  return {
    version: "1.0.0",
    service: "siliconpath-backend",
    description: "Standalone scraping backend for SiliconPath (Render-deployed)",
    baseUrl: "https://siliconpath-backend.onrender.com",
    totalSources: SOURCES.length,
    activeSources: SOURCES.filter((s) => s.active).length,
    adapterTypes: [...new Set(SOURCES.map((s) => s.type))],
    categories: [...new Set(SOURCES.map((s) => s.category))],
    batches,
    documentationUrl: "https://github.com/amitkr26/SiliconPath/blob/main/backend/README.md",
  };
}