import { logger } from "./logger.js";

async function getDb1() {
  const { createClient } = await import("@supabase/supabase-js");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getDb2() {
  const { createClient } = await import("@supabase/supabase-js");
  if (!process.env.SUPABASE_2_URL || !process.env.SUPABASE_2_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.SUPABASE_2_URL, process.env.SUPABASE_2_SERVICE_ROLE_KEY);
}

async function getNeon1() {
  const { neon } = await import("@neondatabase/serverless");
  if (!process.env.NEON_1_DATABASE_URL) return null;
  return neon(process.env.NEON_1_DATABASE_URL);
}

async function getNeon2() {
  const { neon } = await import("@neondatabase/serverless");
  if (!process.env.NEON_2_DATABASE_URL) return null;
  return neon(process.env.NEON_2_DATABASE_URL);
}

export async function archiveOldNews(): Promise<{ archived: number; errors: string[] }> {
  const db1 = await getDb1();
  const db2 = await getDb2();
  if (!db1 || !db2) {
    logger.warn("[Maintenance] archiveOldNews: databases not configured");
    return { archived: 0, errors: ["Databases not configured"] };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: oldNews, error: fetchError } = await db1
    .from("news_articles")
    .select("*")
    .lt("created_at", thirtyDaysAgo.toISOString())
    .limit(100);

  if (fetchError) {
    logger.error("[Maintenance] archiveOldNews fetch error:", fetchError);
    return { archived: 0, errors: [fetchError.message] };
  }

  if (!oldNews || oldNews.length === 0) {
    logger.info("[Maintenance] archiveOldNews: no news to archive");
    return { archived: 0, errors: [] };
  }

  const errors: string[] = [];
  let archived = 0;

  for (const article of oldNews) {
    const { error: insertError } = await db2
      .from("news_archive")
      .insert({
        id: article.id,
        title: article.title,
        summary: article.summary,
        source: article.source,
        source_url: article.source_url,
        image_url: article.image_url,
        tags: article.tags,
        slug: article.slug,
        published_at: article.published_at,
        created_at: article.created_at,
      });

    if (insertError) {
      errors.push(`Failed to archive ${article.id}: ${insertError.message}`);
    } else {
      await db1.from("news_articles").delete().eq("id", article.id);
      archived++;
    }
  }

  logger.info(`[Maintenance] archiveOldNews: archived ${archived}, errors ${errors.length}`);
  return { archived, errors };
}

export async function syncOpportunityReplica(): Promise<{ synced: number; errors: string[] }> {
  const db1 = await getDb1();
  const neonSecondary = await getNeon2();
  if (!db1 || !neonSecondary) {
    logger.warn("[Maintenance] syncReplica: databases not configured");
    return { synced: 0, errors: ["Databases not configured"] };
  }

  const { data: opportunities, error: oppError } = await db1
    .from("opportunities")
    .select("*")
    .eq("is_active", true);

  if (oppError) {
    logger.error("[Maintenance] syncReplica fetch error:", oppError);
    return { synced: 0, errors: [oppError.message] };
  }

  if (!opportunities || opportunities.length === 0) {
    logger.info("[Maintenance] syncReplica: no opportunities to sync");
    return { synced: 0, errors: [] };
  }

  let synced = 0;
  const errors: string[] = [];

  for (const opp of opportunities) {
    try {
      await neonSecondary`
        INSERT INTO opportunities_mirror (
          id, title, organization, category, location, stipend, deadline,
          eligibility, description, apply_link, tags, slug, verification_status,
          is_active, apply_clicks, posted_at, created_at, synced_at
        ) VALUES (
          ${opp.id}, ${opp.title}, ${opp.organization}, ${opp.category},
          ${opp.location}, ${opp.stipend}, ${opp.deadline ? opp.deadline.split('T')[0] : null},
          ${opp.eligibility}, ${opp.description}, ${opp.apply_link},
          ${opp.tags}, ${opp.slug}, ${opp.verification_status},
          ${opp.is_active}, ${opp.apply_clicks || 0}, ${opp.posted_at},
          ${opp.created_at}, now()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          organization = EXCLUDED.organization,
          category = EXCLUDED.category,
          location = EXCLUDED.location,
          stipend = EXCLUDED.stipend,
          deadline = EXCLUDED.deadline::date,
          eligibility = EXCLUDED.eligibility,
          description = EXCLUDED.description,
          apply_link = EXCLUDED.apply_link,
          tags = EXCLUDED.tags,
          verification_status = EXCLUDED.verification_status,
          is_active = EXCLUDED.is_active,
          synced_at = now()
      `;
      synced++;
    } catch (e) {
      errors.push(`Failed to sync ${opp.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  logger.info(`[Maintenance] syncReplica: synced ${synced}, errors ${errors.length}`);
  return { synced, errors };
}
