import * as fs from 'fs';
import * as https from 'https';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We use the token found in previous scripts for the management API
const token = process.env.SUPABASE_MGMT_TOKEN || '';
const projectRef = 'aqauempuwmbizqoaolop';

function runSql(query: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });
    
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const sqlFile = 'supabase/migrations/20260706000001_batch1_sources.sql';
  console.log(`Reading SQL migration from ${sqlFile}...`);
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  console.log("Applying batch1_sources migration on Supabase Primary (db1)...");
  const res = await runSql(sql);
  console.log("Response status:", res.status);
  console.log("Response data:", JSON.stringify(res.data || res.text || {}, null, 2));
}

main();
