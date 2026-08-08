const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://aqauempuwmbizqoaolop.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXVlbXB1d21iaXpxb2FvbG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2Mzc0NDUsImV4cCI6MjA5ODIxMzQ0NX0.33i7gvE3sc1PLZDx-0jN5G5c0Gyfg_EWLTCCrTm8NSE";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXVlbXB1d21iaXpxb2FvbG9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjYzNzQ0NSwiZXhwIjoyMDk4MjEzNDQ1fQ.0u5fIs35SW5lAtmdoxoOrFjLkBHqkPEbLC_oa925Vq4";

const supabase = createClient(supabaseUrl, serviceRoleKey);
const clientUser1 = createClient(supabaseUrl, anonKey);
const clientUser2 = createClient(supabaseUrl, anonKey);

async function testLiveFlow() {
  console.log("=== STEP 1: AUTHENTICATING TEST USERS ===");

  // 1. Log in Candidate (User 1)
  const { data: auth1, error: err1 } = await clientUser1.auth.signInWithPassword({
    email: "xasefe9251@bejum.com",
    password: "12345678"
  });

  if (err1) {
    console.error("User 1 Login Failed:", err1.message);
    return;
  }
  const user1 = auth1.user;
  console.log(`✅ Candidate logged in: ${user1.email} (ID: ${user1.id})`);

  // 2. Log in Employer (User 2)
  const { data: auth2, error: err2 } = await clientUser2.auth.signInWithPassword({
    email: "weqolyji@forexzig.com",
    password: "87654321"
  });

  if (err2) {
    console.error("User 2 Login Failed:", err2.message);
    return;
  }
  const user2 = auth2.user;
  console.log(`✅ Employer logged in: ${user2.email} (ID: ${user2.id})`);

  console.log("\n=== STEP 1.1: TESTING NETWORK CONNECTION REQUEST ===");
  // User 1 sends connection request to User 2
  // Check if connection already exists in connections table
  const { data: existingConn } = await supabase
    .from("connections")
    .select("*")
    .or(`and(requester_id.eq.${user1.id},addressee_id.eq.${user2.id}),and(requester_id.eq.${user2.id},addressee_id.eq.${user1.id})`);

  console.log("Existing connections between user1 and user2:", existingConn);

  // Clear previous test connection if needed
  if (existingConn && existingConn.length > 0) {
    await supabase.from("connections").delete().in("id", existingConn.map(c => c.id));
    console.log("Cleared previous test connection.");
  }

  // Insert fresh connection request as User 1
  const { data: newConn, error: connErr } = await clientUser1
    .from("connections")
    .insert({
      requester_id: user1.id,
      addressee_id: user2.id,
      status: "pending"
    })
    .select()
    .single();

  if (connErr) {
    console.error("❌ Failed to send connection request:", connErr);
  } else {
    console.log("✅ Connection request created in Supabase 'connections' table:", newConn);
  }

  // User 2 accepts connection request
  if (newConn) {
    console.log("\n=== STEP 1.2: TESTING ACCEPT CONNECTION REQUEST ===");
    const { data: acceptedConn, error: acceptErr } = await clientUser2
      .from("connections")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", newConn.id)
      .select()
      .single();

    if (acceptErr) {
      console.error("❌ Failed to accept connection request:", acceptErr);
    } else {
      console.log("✅ Connection accepted:", acceptedConn);
    }
  }

  console.log("\n=== STEP 1.3: TESTING MESSAGING FLOW ===");
  // Check conversations
  const a = user1.id < user2.id ? user1.id : user2.id;
  const b = user1.id < user2.id ? user2.id : user1.id;

  let { data: conv } = await supabase
    .from("conversations")
    .select("*")
    .eq("participant_a", a)
    .eq("participant_b", b)
    .maybeSingle();

  if (!conv) {
    const { data: createdConv, error: createConvErr } = await supabase
      .from("conversations")
      .insert({
        participant_a: a,
        participant_b: b,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createConvErr) {
      console.error("❌ Failed to create conversation:", createConvErr);
    } else {
      conv = createdConv;
      console.log("✅ Created new conversation:", conv);
    }
  } else {
    console.log("✅ Found existing conversation:", conv);
  }

  if (conv) {
    // User 1 sends message
    const msgText = "Hello! Interested in VLSI verification roles.";
    const { data: sentMsg, error: msgErr } = await clientUser1
      .from("messages")
      .insert({
        conversation_id: conv.id,
        sender_id: user1.id,
        body: msgText,
        is_read: false
      })
      .select()
      .single();

    if (msgErr) {
      console.error("❌ Failed to send message:", msgErr);
    } else {
      console.log("✅ User 1 sent message:", sentMsg);
    }

    // User 2 reads and replies
    const replyText = "Great! Please share your updated resume.";
    const { data: replyMsg, error: replyErr } = await clientUser2
      .from("messages")
      .insert({
        conversation_id: conv.id,
        sender_id: user2.id,
        body: replyText,
        is_read: false
      })
      .select()
      .single();

    if (replyErr) {
      console.error("❌ Failed to send reply:", replyErr);
    } else {
      console.log("✅ User 2 sent reply:", replyMsg);
    }

    // Fetch conversation thread
    const { data: allMessages, error: fetchErr } = await clientUser1
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    if (fetchErr) {
      console.error("❌ Failed to fetch messages:", fetchErr);
    } else {
      console.log(`\n✅ Thread retrieved successfully (${allMessages.length} messages):`);
      allMessages.forEach(m => {
        const sender = m.sender_id === user1.id ? "Candidate" : "Employer";
        console.log(`  [${sender}]: ${m.body} (Read: ${m.is_read})`);
      });
    }
  }
}

testLiveFlow();
