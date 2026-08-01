const { neon } = require("@neondatabase/serverless");

const neon1Url = "postgresql://neondb_owner:npg_Jp3OtAenHVM5@ep-green-paper-ad3dy630-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
const neon2Url = "postgresql://neondb_owner:npg_MyvHzL81UPTa@ep-crimson-tree-atp6kiq0-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function testNeon() {
  console.log("Testing Neon Database 1 (electrobridge main)...");
  try {
    const sql1 = neon(neon1Url);
    const result1 = await sql1`SELECT NOW() as current_time`;
    console.log("Neon 1 Connected! Time:", result1[0].current_time);
  } catch (err) {
    console.error("Neon 1 Error:", err.message);
  }

  console.log("Testing Neon Database 2 (electrobridge secondary)...");
  try {
    const sql2 = neon(neon2Url);
    const result2 = await sql2`SELECT NOW() as current_time`;
    console.log("Neon 2 Connected! Time:", result2[0].current_time);
  } catch (err) {
    console.error("Neon 2 Error:", err.message);
  }
}

testNeon();
