const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
