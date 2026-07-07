import * as fs from 'fs';

const results = JSON.parse(fs.readFileSync('batch1_results.json', 'utf8'));

let sql = `-- ═══════════════════════════════════════════════════════════════
-- ElectroBridge Batch 1 ATS Sources
-- ═══════════════════════════════════════════════════════════════

INSERT INTO scrape_sources (name, source_type, adapter, url, category, is_active, priority) VALUES
`;

const values = results.map((src: any) => {
  return `  ('${src.name.replace(/'/g, "''")}', '${src.source_type}', '${src.adapter}', '${src.url}', 'Private Job', true, 10)`;
});

sql += values.join(',\n') + ';\n';

fs.writeFileSync('supabase/migrations/20260706000001_batch1_sources.sql', sql);
console.log('Migration generated.');
