// Provenance helpers (Phase 12 of CONTENT_UPGRADE_PLAN.md): every generated
// article/opportunity must be traceable to its sources and timestamps.

export interface Provenance {
  source_url: string;
  source_title: string;
  source_publisher: string | null;
  source_published_at: string | null;
  fetched_at: string;
  last_verified_at: string | null;
  processed_at: string;
}

export function makeProvenance(input: {
  sourceUrl: string;
  sourceTitle: string;
  sourcePublisher?: string | null;
  sourcePublishedAt?: string | null;
  fetchedAt?: string;
  lastVerifiedAt?: string | null;
  processedAt?: string;
}): Provenance {
  const now = new Date().toISOString();
  return {
    source_url: input.sourceUrl,
    source_title: input.sourceTitle,
    source_publisher: input.sourcePublisher || null,
    source_published_at: input.sourcePublishedAt || null,
    fetched_at: input.fetchedAt || now,
    last_verified_at: input.lastVerifiedAt || null,
    processed_at: input.processedAt || now,
  };
}