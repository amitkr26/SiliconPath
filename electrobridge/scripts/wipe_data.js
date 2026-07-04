import { createClient } from '@supabase/supabase-js';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function wipeDatabases() {
  console.log('Starting total database wipe...');

  const supabase1 = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const supabase2 = createClient(process.env.SUPABASE_2_URL, process.env.SUPABASE_2_SERVICE_ROLE_KEY);
  const neon1 = neon(process.env.NEON_1_DATABASE_URL);
  const neon2 = neon(process.env.NEON_2_DATABASE_URL);

  // Not providing ID types because UUIDs use strings and numeric IDs use numbers, so we use a non-existent value for both just in case, but an easier way is to just delete where id is not null. Wait, PostgREST doesn't support 'is not null' natively via the JS client easily for all types. We can use .neq('created_at', '1970-01-01') or something.
  // Actually, .gte('created_at', '1970-01-01') works for anything with created_at.
  // Or just .neq('id', '00000000-0000-0000-0000-000000000000') for uuid, and .neq('id', -1) for int.
  
  const db1Tables = [
    { name: 'opportunities', type: 'uuid' },
    { name: 'news_articles', type: 'uuid' },
    { name: 'companies', type: 'uuid' },
    { name: 'subscribers', type: 'uuid' }
  ];
  
  const db2Tables = [
    { name: 'user_profiles', type: 'uuid' },
    { name: 'connections', type: 'uuid' },
    { name: 'feed_posts', type: 'uuid' },
    { name: 'messages', type: 'uuid' },
    { name: 'notifications', type: 'uuid' }
  ];

  console.log('Wiping DB1 (Supabase 1)...');
  for (const table of db1Tables) {
    try {
      const { error } = await supabase1.from(table.name).delete().neq('id', table.type === 'uuid' ? '00000000-0000-0000-0000-000000000000' : -1);
      if (error) console.log(`   - Could not clear ${table.name}: ${error.message}`);
      else console.log(`   - Cleared ${table.name}`);
    } catch (e) {
      console.log(`   - Failed to clear ${table.name}`);
    }
  }

  console.log('Wiping DB2 (Supabase 2)...');
  for (const table of db2Tables) {
    try {
      const { error } = await supabase2.from(table.name).delete().neq('id', table.type === 'uuid' ? '00000000-0000-0000-0000-000000000000' : -1);
      if (error) console.log(`   - Could not clear ${table.name}: ${error.message}`);
      else console.log(`   - Cleared ${table.name}`);
    } catch (e) {
      console.log(`   - Failed to clear ${table.name}`);
    }
  }

  console.log('Wiping DB3 (Neon 1)...');
  try {
    await neon1`
      DROP TABLE IF EXISTS scrape_logs CASCADE;
      DROP TABLE IF EXISTS ai_usage_log CASCADE;
      DROP TABLE IF EXISTS error_logs CASCADE;
      DROP TABLE IF EXISTS cron_health CASCADE;
      
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
    await neon2`
      DROP TABLE IF EXISTS search_indexes CASCADE;
      DROP TABLE IF EXISTS trending_cache CASCADE;
      DROP TABLE IF EXISTS keyword_stats CASCADE;
      
      CREATE TABLE trending_cache (
        id SERIAL PRIMARY KEY,
        category VARCHAR(255),
        data JSONB,
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
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
