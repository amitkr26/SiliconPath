const { createClient } = require('@supabase/supabase-js');
const { neon } = require('@neondatabase/serverless');

async function wipeDatabases() {
  console.log('Starting total database wipe...');

  const neon1 = neon(process.env.NEON_1_DATABASE_URL);
  const neon2 = neon(process.env.NEON_2_DATABASE_URL);

  console.log('Wiping DB3 (Neon 1)...');
  try {
    await neon1`DROP TABLE IF EXISTS scrape_logs CASCADE;`;
    await neon1`DROP TABLE IF EXISTS ai_usage_log CASCADE;`;
    await neon1`DROP TABLE IF EXISTS error_logs CASCADE;`;
    await neon1`DROP TABLE IF EXISTS cron_health CASCADE;`;
    
    await neon1`
      CREATE TABLE scrape_logs (
        id SERIAL PRIMARY KEY,
        source VARCHAR(255),
        items_found INT,
        items_added INT,
        duration_ms INT,
        status VARCHAR(50),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await neon1`
      CREATE TABLE ai_usage_log (
        id SERIAL PRIMARY KEY,
        feature VARCHAR(255),
        provider VARCHAR(255),
        model VARCHAR(255),
        prompt_length INT,
        response_length INT,
        success BOOLEAN,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('   - Wiped and recreated DB3 schemas successfully.');
  } catch (error) {
    console.error('   - Failed DB3:', error.message);
  }

  console.log('Wiping DB4 (Neon 2)...');
  try {
    await neon2`DROP TABLE IF EXISTS search_indexes CASCADE;`;
    await neon2`DROP TABLE IF EXISTS trending_cache CASCADE;`;
    await neon2`DROP TABLE IF EXISTS keyword_stats CASCADE;`;
    
    await neon2`
      CREATE TABLE trending_cache (
        id SERIAL PRIMARY KEY,
        category VARCHAR(255),
        data JSONB,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await neon2`
      CREATE TABLE keyword_stats (
        keyword VARCHAR(255) PRIMARY KEY,
        search_count INT DEFAULT 0,
        last_searched TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('   - Wiped and recreated DB4 schemas successfully.');
  } catch (error) {
    console.error('   - Failed DB4:', error.message);
  }

  console.log('Database wipe and schema assignment complete.');
}

wipeDatabases();
