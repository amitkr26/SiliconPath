const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://aqauempuwmbizqoaolop.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXVlbXB1d21iaXpxb2FvbG9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjYzNzQ0NSwiZXhwIjoyMDk4MjEzNDQ1fQ.0u5fIs35SW5lAtmdoxoOrFjLkBHqkPEbLC_oa925Vq4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchema() {
  console.log("Testing connection_requests table...");
  const { data: cols1, error: err1 } = await supabase
    .from('connection_requests')
    .select('*')
    .limit(1);
  if (err1) {
    console.error("connection_requests ERROR:", err1.message);
  } else {
    console.log("connection_requests works, columns:", cols1);
  }

  console.log("Testing feed_post_reposts table...");
  const { data: cols2, error: err2 } = await supabase
    .from('feed_post_reposts')
    .select('*')
    .limit(1);
  if (err2) {
    console.error("feed_post_reposts ERROR:", err2.message);
  } else {
    console.log("feed_post_reposts works, columns:", cols2);
  }
}

testSchema();
