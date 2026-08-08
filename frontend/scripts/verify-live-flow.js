const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://aqauempuwmbizqoaolop.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXVlbXB1d21iaXpxb2FvbG9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjYzNzQ0NSwiZXhwIjoyMDk4MjEzNDQ1fQ.0u5fIs35SW5lAtmdoxoOrFjLkBHqkPEbLC_oa925Vq4";

const supabase = createClient(supabaseUrl, serviceKey);

async function verifyAllLive() {
  console.log("=== 1. VERIFYING USER PROFILES & FOREIGN KEYS ===");
  const { data: profiles, error: pErr } = await supabase
    .from("user_profiles")
    .select("id, email, display_name, username");
  console.log("Total registered user profiles in primary DB:", profiles?.length);

  // Candidate user
  const candidate = profiles.find(p => p.email === "xasefe9251@bejum.com");
  // Employer user
  const employer = profiles.find(p => p.email === "weqolyji@forexzig.com");

  console.log("Candidate profile:", candidate);
  console.log("Employer profile:", employer);

  console.log("\n=== 2. CREATING REAL CONNECTION REQUEST ===");
  // Clean prior test connection between candidate and employer
  await supabase
    .from("connections")
    .delete()
    .or(`and(requester_id.eq.${candidate.id},addressee_id.eq.${employer.id}),and(requester_id.eq.${employer.id},addressee_id.eq.${candidate.id})`);

  const { data: newConn, error: connErr } = await supabase
    .from("connections")
    .insert({
      requester_id: candidate.id,
      addressee_id: employer.id,
      status: "pending"
    })
    .select()
    .single();

  console.log("Connection Request Created:", newConn, "Error:", connErr);

  console.log("\n=== 3. ACCEPTING CONNECTION REQUEST ===");
  const { data: acceptedConn, error: accErr } = await supabase
    .from("connections")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", newConn.id)
    .select()
    .single();

  console.log("Connection Accepted:", acceptedConn, "Error:", accErr);

  console.log("\n=== 4. SENDING & RECEIVING LIVE MESSAGE ===");
  // Find or create conversation
  let { data: conv } = await supabase
    .from("conversations")
    .select("*")
    .or(`and(participant_a.eq.${candidate.id},participant_b.eq.${employer.id}),and(participant_a.eq.${employer.id},participant_b.eq.${candidate.id})`)
    .maybeSingle();

  if (!conv) {
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        participant_a: candidate.id,
        participant_b: employer.id,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();
    conv = newConv;
  }

  // Candidate sends message
  const { data: msg1, error: m1Err } = await supabase
    .from("messages")
    .insert({
      conversation_id: conv.id,
      sender_id: candidate.id,
      body: "Hi Vikram, I reviewed the VLSI Verification posting and my SystemVerilog profile is ready.",
      is_read: false
    })
    .select()
    .single();

  console.log("Candidate sent message:", msg1, "Error:", m1Err);

  // Employer replies
  const { data: msg2, error: m2Err } = await supabase
    .from("messages")
    .insert({
      conversation_id: conv.id,
      sender_id: employer.id,
      body: "Hi Ajeet, profile looks great! When are you available for a technical discussion on UVM?",
      is_read: false
    })
    .select()
    .single();

  console.log("Employer replied:", msg2, "Error:", m2Err);

  console.log("\n=== 5. RETRIEVING CONVERSATION THREAD ===");
  const { data: thread } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true });

  console.log("Total messages in active thread:", thread?.length);
  thread?.forEach(m => {
    const sender = m.sender_id === candidate.id ? "Candidate" : "Employer";
    console.log(`[${sender}]: ${m.body} (Read: ${m.is_read})`);
  });
}

verifyAllLive();
