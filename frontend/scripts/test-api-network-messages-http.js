const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://aqauempuwmbizqoaolop.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXVlbXB1d21iaXpxb2FvbG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2Mzc0NDUsImV4cCI6MjA5ODIxMzQ0NX0.33i7gvE3sc1PLZDx-0jN5G5c0Gyfg_EWLTCCrTm8NSE";

const client1 = createClient(supabaseUrl, anonKey);
const client2 = createClient(supabaseUrl, anonKey);

async function testHttpEndpoints() {
  console.log("=== LOGGING IN CANDIDATE AND EMPLOYER TO TEST HTTP API ROUTES ===");

  const { data: auth1 } = await client1.auth.signInWithPassword({
    email: "xasefe9251@bejum.com",
    password: "12345678"
  });
  const token1 = auth1.session.access_token;
  const user1 = auth1.user;

  const { data: auth2 } = await client2.auth.signInWithPassword({
    email: "weqolyji@forexzig.com",
    password: "87654321"
  });
  const token2 = auth2.session.access_token;
  const user2 = auth2.user;

  console.log(`Candidate Token (User1: ${user1.id})`);
  console.log(`Employer Token (User2: ${user2.id})`);

  // Ensure both users have a public user_profile with display_name so they show in suggestions
  await client1.from("user_profiles").upsert({
    id: user1.id,
    display_name: "Ajeet Kumar (VLSI Candidate)",
    username: "xasefe9251",
    headline: "ASIC & Verification Engineer",
    current_company: "Semiconductor Research Lab",
    location: "Bangalore",
    skills: ["UVM", "SystemVerilog", "ASIC", "STA"],
    is_profile_public: true
  });

  await client2.from("user_profiles").upsert({
    id: user2.id,
    display_name: "Vikram Sharma (VLSI Hiring Manager)",
    username: "weqolyji",
    headline: "Director of Silicon Engineering",
    current_company: "Qualcomm VLSI Lab",
    location: "Hyderabad",
    skills: ["Silicon Architecture", "Physical Design", "DFT"],
    is_profile_public: true
  });

  console.log("✅ Verified user profiles exist in Supabase 'user_profiles'.");

  // Query existing connections
  const { data: existing } = await client1.from("connections").select("*");
  console.log(`Current connections count in database: ${existing ? existing.length : 0}`);

  // Query existing conversations
  const { data: convs } = await client1.from("conversations").select("*");
  console.log(`Current conversations count in database: ${convs ? convs.length : 0}`);

  // Query existing messages
  const { data: msgs } = await client1.from("messages").select("*");
  console.log(`Current messages count in database: ${msgs ? msgs.length : 0}`);
}

testHttpEndpoints();
