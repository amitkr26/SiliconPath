import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log("Env loaded:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
await import('./scripts/run_scrape_pipeline.ts');
