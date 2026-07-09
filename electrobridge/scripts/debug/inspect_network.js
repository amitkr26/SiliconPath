const { neon } = require('@neondatabase/serverless');

const sql = neon("postgresql://neondb_owner:npg_1xShpQd7gJvV@ep-black-butterfly-a83dveat-pooler.eastus2.azure.neon.tech/neondb?sslmode=require");

async function main() {
  try {
    const res = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'connection_requests';
    `;
    console.log('connection_requests columns:', res);

    const res2 = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'feed_post_reposts';
    `;
    console.log('feed_post_reposts columns:', res2);

  } catch (error) {
    console.error('Error:', error);
  }
}
main();
