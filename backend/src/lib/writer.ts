import { ScrapedOpportunity } from "../scrapers/types.js";
import { getDB } from "./db.js";
import { logger } from "./logger.js";

const BATCH_SIZE = 50;

function deduplicate(items: ScrapedOpportunity[]): ScrapedOpportunity[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.organization}|${item.title}|${item.apply_link ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function writeOpportunities(
  items: ScrapedOpportunity[],
  sourceId: string,
): Promise<{ inserted: number; errors: number }> {
  const db = getDB("opportunities");
  if (!db.client) {
    logger.warn(`[Writer] ${sourceId}: no DB configured, ${items.length} items dropped`);
    return { inserted: 0, errors: 0 };
  }

  const unique = deduplicate(items);
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    try {
      if (db.type === "supabase") {
        const { error } = await db.client.from("opportunities").upsert(
          batch.map((item) => ({
            title: item.title,
            organization: item.organization,
            category: item.category,
            location: item.location,
            stipend: item.stipend,
            deadline: item.deadline,
            eligibility: item.eligibility,
            description: item.description,
            apply_link: item.apply_link,
            source_url: item.source_url,
            tags: item.tags,
            source_id: sourceId,
            scraped_at: new Date().toISOString(),
          })),
          { onConflict: "apply_link", ignoreDuplicates: false },
        );
        if (error) {
          logger.error(`[Writer] Supabase insert error: ${error.message}`);
          errors += batch.length;
        } else {
          inserted += batch.length;
        }
      } else {
        // Neon SQL fallback
        const sql = db.client;
        for (const item of batch) {
          await sql`
            INSERT INTO opportunities (title, organization, category, location, stipend, deadline, eligibility, description, apply_link, source_url, tags, source_id, scraped_at)
            VALUES (${item.title}, ${item.organization}, ${item.category}, ${item.location}, ${item.stipend}, ${item.deadline}, ${item.eligibility}, ${item.description}, ${item.apply_link}, ${item.source_url}, ${item.tags}, ${sourceId}, ${new Date().toISOString()})
            ON CONFLICT (apply_link) DO UPDATE SET scraped_at = EXCLUDED.scraped_at, description = EXCLUDED.description
          `;
          inserted++;
        }
      }
    } catch (e) {
      logger.error(`[Writer] Batch error:`, e instanceof Error ? e.message : e);
      errors += batch.length;
    }
  }

  logger.info(`[Writer] ${sourceId}: ${inserted} inserted, ${errors} errors out of ${unique.length} unique`);
  return { inserted, errors };
}

export async function writeResultsBySource(
  results: Map<string, ScrapedOpportunity[]>,
): Promise<{ totalInserted: number; totalErrors: number }> {
  let totalInserted = 0;
  let totalErrors = 0;

  for (const [sourceId, items] of results) {
    if (items.length === 0) continue;
    const { inserted, errors } = await writeOpportunities(items, sourceId);
    totalInserted += inserted;
    totalErrors += errors;
  }

  logger.info(`[Writer] All sources: ${totalInserted} total inserted, ${totalErrors} errors`);
  return { totalInserted, totalErrors };
}
