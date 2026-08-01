const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://aqauempuwmbizqoaolop.supabase.co";
const supabaseServiceRoleKey = "REDACTED_SUPABASE_SECRET_DB1_OLD";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function generateCleanSeoSlug(title, id) {
  if (!title) return `opportunity-${id.slice(0, 8)}`;
  
  let clean = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-")         // Replace spaces with single hyphen
    .replace(/-+/g, "-")          // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, "");     // Trim hyphens from start and end

  if (clean.length > 60) {
    clean = clean.slice(0, 60).replace(/-+[^-]*$/, "");
  }

  return clean || `opportunity-${id.slice(0, 8)}`;
}

async function cleanAllSlugs() {
  console.log("Fetching all opportunities for fast bulk SEO slug cleaning...");

  // Supabase default limit is 1000, so we fetch in batches
  let allOpportunities = [];
  let from = 0;
  let step = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("opportunities")
      .select("id, title, slug")
      .range(from, from + step - 1);

    if (error) {
      console.error("Fetch error:", error);
      break;
    }

    if (!data || data.length === 0) break;
    allOpportunities = allOpportunities.concat(data);
    from += step;
  }

  console.log(`Fetched ${allOpportunities.length} opportunities. Generating clean SEO slugs...`);

  const slugMap = new Map();
  const updates = [];

  for (const opp of allOpportunities) {
    let cleanSlug = generateCleanSeoSlug(opp.title, opp.id);
    
    if (slugMap.has(cleanSlug)) {
      const count = slugMap.get(cleanSlug) + 1;
      slugMap.set(cleanSlug, count);
      cleanSlug = `${cleanSlug}-${count}`;
    } else {
      slugMap.set(cleanSlug, 1);
    }

    if (opp.slug !== cleanSlug) {
      updates.push({ id: opp.id, slug: cleanSlug });
    }
  }

  console.log(`Updating ${updates.length} opportunity slugs in database...`);

  // Execute in concurrent batches of 50
  const batchSize = 50;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    await Promise.all(
      batch.map((u) => supabase.from("opportunities").update({ slug: u.slug }).eq("id", u.id))
    );
  }

  console.log(`Successfully completed clean SEO slug migration for all ${allOpportunities.length} opportunities!`);
}

cleanAllSlugs();
