// Delete all auth users + create 2 test users using Supabase Admin API
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envLines = readFileSync("D:\\Tinkerscape\\SiliconPath\\frontend\\.env.local", "utf8")
  .split("\n").reduce((a, l) => { const m = l.match(/^([A-Z_]+)=(.*)/); if (m) a[m[1]] = m[2].trim(); return a; }, {});

const url = envLines.NEXT_PUBLIC_SUPABASE_URL;
const key = envLines.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Missing env vars"); process.exit(1); }

const admin = createClient(url, key);

// 1. List and delete ALL auth users
console.log("=== Deleting all auth users ===");
let page = 1;
let totalDeleted = 0;
while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 50 });
  if (error) { console.error("listUsers error:", error); break; }
  if (!data.users.length) break;
  
  for (const u of data.users) {
    const { error: delErr } = await admin.auth.admin.deleteUser(u.id);
    if (delErr) console.error(`Failed to delete ${u.id}:`, delErr.message);
    else { totalDeleted++; console.log(`  Deleted: ${u.id} (${u.email})`); }
  }
  page++;
  if (data.users.length < 50) break;
}
console.log(`Total deleted: ${totalDeleted}`);

// 2. Create 2 test users
console.log("\n=== Creating test users ===");

const users = [
  {
    email: "amittest1@berojgardegreewala.com",
    password: "TestPassword123!",
    metadata: {
      username: "amittest1",
      full_name: "Amit Test User 1",
      account_type: "seeker",
      role: "seeker"
    },
    profile: {
      username: "amittest1",
      display_name: "Amit Test User 1",
      headline: "VLSI Verification Engineer",
      bio: "Experienced verification engineer specializing in UVM, SystemVerilog, and formal verification. 5 years in semiconductor industry.",
      location: "Bengaluru, India",
      account_type: "seeker",
      skills: ["UVM", "SystemVerilog", "Verilog", "Formal Verification", "ASIC"],
      interests: ["RISC-V", "Open Source Hardware"],
      is_profile_public: true,
      is_open_to_work: true
    }
  },
  {
    email: "amittest2@berojgardegreewala.com",
    password: "TestPassword123!",
    metadata: {
      username: "amittest2",
      full_name: "Amit Test User 2",
      account_type: "seeker",
      role: "seeker"
    },
    profile: {
      username: "amittest2",
      display_name: "Amit Test User 2",
      headline: "Physical Design Engineer",
      bio: "Physical design expert with deep knowledge in STA, PnR, and power integrity. Worked on multiple 7nm tapeouts at leading semiconductor companies.",
      location: "Hyderabad, India",
      account_type: "seeker",
      skills: ["STA", "PnR", "TCL", "Physical Design", "Cadence"],
      interests: ["FinFET", "Advanced Node Design"],
      is_profile_public: true,
      is_open_to_work: true
    }
  }
];

const createdIds = [];

for (const u of users) {
  console.log(`\nCreating: ${u.email}`);
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: u.metadata
  });
  
  if (error) {
    console.error(`  ERROR: ${error.message}`);
    continue;
  }
  
  console.log(`  Created auth user: ${data.user.id}`);
  createdIds.push(data.user.id);
  
  // Create profile
  const { error: profErr } = await admin.from("user_profiles").insert({
    id: data.user.id,
    ...u.profile
  });
  
  if (profErr) {
    console.error(`  Profile error: ${profErr.message}`);
  } else {
    console.log(`  Profile created: ${u.profile.username}`);
  }
}

console.log(`\n=== Done! Created ${createdIds.length} users ===`);
console.log("User IDs:", createdIds);
console.log("\nLogin credentials:");
console.log("  User 1: amittest1@berojgardegreewala.com / TestPassword123!");
console.log("  User 2: amittest2@berojgardegreewala.com / TestPassword123!");
