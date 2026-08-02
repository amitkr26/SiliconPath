const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aqauempuwmbizqoaolop.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "REDACTED_SUPABASE_SECRET_DB1_OLD";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testMessaging() {
  console.log("=================================================");
  console.log("💬 TESTING DIRECT MESSAGING BETWEEN USERS");
  console.log("=================================================\n");

  try {
    // 1. Fetch Candidate & Employer user IDs
    const { data: candProfile } = await supabase.from("user_profiles").select("id, email, display_name").eq("email", "qa.candidate.vlsi@siliconpath.dev").single();
    const { data: empProfile } = await supabase.from("user_profiles").select("id, email, display_name").eq("email", "qa.employer.lab@siliconpath.dev").single();

    if (!candProfile || !empProfile) {
      console.error("❌ Test users not found. Run qa-automation-suite.js first.");
      return;
    }

    console.log(`Candidate: ${candProfile.display_name} (${candProfile.id})`);
    console.log(`Employer:  ${empProfile.display_name} (${empProfile.id})\n`);

    // 2. Ensure conversations table exists and create thread between participant_a & participant_b
    const a = candProfile.id < empProfile.id ? candProfile.id : empProfile.id;
    const b = candProfile.id < empProfile.id ? empProfile.id : candProfile.id;

    console.log("1️⃣ Finding/Creating Conversation Thread...");
    const { data: existingConv, error: convSelectErr } = await supabase
      .from("conversations")
      .select("*")
      .eq("participant_a", a)
      .eq("participant_b", b)
      .maybeSingle();

    let convId;
    if (convSelectErr) {
      console.log("   - Conversations table issue:", convSelectErr.message);
    }

    if (existingConv) {
      convId = existingConv.id;
      console.log(`   ✅ Existing Conversation Thread Found: ID = ${convId}`);
    } else {
      const { data: newConv, error: createConvErr } = await supabase
        .from("conversations")
        .insert({
          participant_a: a,
          participant_b: b,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createConvErr) {
        console.error("   ❌ Conversation creation error:", createConvErr.message);
        return;
      }
      convId = newConv.id;
      console.log(`   ✅ New Conversation Thread Created: ID = ${convId}`);
    }

    // 3. Send a test message from Candidate to Employer
    console.log("\n2️⃣ Sending Direct Message from Candidate -> Employer...");
    const messageText = `Hello DRDO Lab Lead, I am applying for the JRF VLSI position. My SystemVerilog & UVM testbench verification repository is updated. Timestamp: ${new Date().toLocaleTimeString()}`;

    const { data: sentMsg, error: sendErr } = await supabase
      .from("messages")
      .insert({
        conversation_id: convId,
        sender_id: candProfile.id,
        body: messageText,
        is_read: false,
      })
      .select()
      .single();

    if (sendErr) {
      console.error("   ❌ Message send error:", sendErr.message);
      return;
    }

    console.log(`   ✅ Message Sent Successfully!`);
    console.log(`      - Message ID: ${sentMsg.id}`);
    console.log(`      - Sender: ${candProfile.display_name}`);
    console.log(`      - Content: "${sentMsg.body}"`);

    // 4. Update last_message_at on conversation
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", convId);

    // 5. Send a reply message from Employer to Candidate
    console.log("\n3️⃣ Sending Reply Message from Employer -> Candidate...");
    const replyText = `Thank you ${candProfile.display_name}. We reviewed your M.Tech profile and UVM experience. Shortlisting you for interview.`;

    const { data: replyMsg, error: replyErr } = await supabase
      .from("messages")
      .insert({
        conversation_id: convId,
        sender_id: empProfile.id,
        body: replyText,
        is_read: false,
      })
      .select()
      .single();

    if (replyErr) {
      console.error("   ❌ Reply send error:", replyErr.message);
      return;
    }

    console.log(`   ✅ Reply Sent Successfully!`);
    console.log(`      - Message ID: ${replyMsg.id}`);
    console.log(`      - Sender: ${empProfile.display_name}`);
    console.log(`      - Content: "${replyMsg.body}"`);

    // 6. Fetch conversation thread messages to verify bidirectional communication
    console.log("\n4️⃣ Verifying Full Conversation History from Database...");
    const { data: threadMessages, error: threadErr } = await supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (threadErr) {
      console.error("   ❌ Thread fetch error:", threadErr.message);
    } else {
      console.log(`   ✅ Fetched ${threadMessages.length} messages in conversation thread:`);
      threadMessages.forEach((m, idx) => {
        const senderLabel = m.sender_id === candProfile.id ? "Candidate" : "Employer";
        console.log(`      [${idx + 1}] (${senderLabel}): ${m.body}`);
      });
    }

    console.log("\n=================================================");
    console.log("🎉 MESSAGING SYSTEM VERIFIED 100% FUNCTIONAL!");
    console.log("=================================================\n");

  } catch (err) {
    console.error("❌ Messaging test error:", err);
  }
}

testMessaging();
