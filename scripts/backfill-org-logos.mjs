/**
 * backfill-org-logos.mjs
 * Backfills verified organization logo URLs into the Supabase `organizations` table.
 * Reads from the `organization-logos` storage bucket and updates records by slug.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/backfill-org-logos.mjs
 *
 * No secrets are hardcoded — all credentials come from environment variables.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'organization-logos';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY env vars are required.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Verified organization logo registry.
 * Keys match the `slug` column in the `organizations` table.
 * Values are filenames in the `organization-logos` Supabase Storage bucket.
 *
 * ⚠️  Only add entries here after manual verification of the logo asset.
 *     Never set is_verified status from this script — verification is handled
 *     separately via the evidence-gated resolve pipeline.
 */
const VERIFIED_ORG_LOGOS = {
  "isro":   "isro.svg",
  "drdo":   "drdo.svg",
  "csir":   "csir.svg",
  "iit":    "iit.svg",
  "intel":  "intel.svg",
  "amd":    "amd.svg",
  "nvidia": "nvidia.svg",
  "qualcomm": "qualcomm.svg",
  "texas-instruments": "ti.svg",
  "tata-elxsi": "tata-elxsi.svg",
  "wipro":  "wipro.svg",
};

async function run() {
  console.log(`[backfill-org-logos] Starting — ${Object.keys(VERIFIED_ORG_LOGOS).length} orgs to process`);
  let updated = 0;
  let skipped = 0;

  for (const [slug, filename] of Object.entries(VERIFIED_ORG_LOGOS)) {
    // Resolve public URL from storage bucket
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filename);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      console.warn(`  [SKIP] No public URL for ${slug} (${filename})`);
      skipped++;
      continue;
    }

    // Update the organization record — never touch is_verified
    const { error } = await supabase
      .from('organizations')
      .update({ logo_url: publicUrl })
      .eq('slug', slug);

    if (error) {
      console.error(`  [ERROR] ${slug}: ${error.message}`);
      skipped++;
    } else {
      console.log(`  [OK] ${slug} → ${publicUrl}`);
      updated++;
    }
  }

  console.log(`\n[backfill-org-logos] Done — ${updated} updated, ${skipped} skipped.`);
}

run().catch((err) => {
  console.error('[backfill-org-logos] Fatal error:', err);
  process.exit(1);
});
