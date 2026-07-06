import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env variables
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = value;
    }
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchYoutubeTitle(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const text = await res.text();
    const titleMatch = text.match(/<title>(.*?)<\/title>/);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].replace(' - YouTube', '').trim().toLowerCase();
    }
    return "";
  } catch (e) {
    return "";
  }
}

// Validation Safeguard
export async function validateVideoTopicOverlap(videoId, expectedTopic) {
  if (!videoId || videoId === 'FLAGGED_NEEDS_MANUAL_SELECTION') return false;
  
  const title = await fetchYoutubeTitle(videoId);
  if (!title) return false;

  // Simple topic overlap: Check if any major keyword matches
  const expectedKeywords = expectedTopic.toLowerCase().split(/[\s,]+/);
  
  let overlapFound = false;
  for (const keyword of expectedKeywords) {
    if (keyword.length > 3 && title.includes(keyword)) {
      overlapFound = true;
      break;
    }
  }

  return overlapFound;
}

// Cron Job Simulation / Verifier
async function runVerificationCron() {
  console.log("Running YouTube Topic Validation Cron Job...");
  
  const { data: days } = await supabase.from('learning_days').select('*');
  if (!days) return;

  for (const day of days) {
    if (day.video_ref && day.video_ref !== 'FLAGGED_NEEDS_MANUAL_SELECTION') {
      const isValid = await validateVideoTopicOverlap(day.video_ref, day.title);
      
      if (!isValid) {
        console.warn(`[WARNING] Drift detected on Day ${day.day_number}: '${day.title}'. Flagging video ${day.video_ref}`);
        await supabase
          .from('learning_days')
          .update({ video_ref: 'FLAGGED_NEEDS_MANUAL_SELECTION' })
          .eq('id', day.id);
      } else {
        console.log(`[OK] Day ${day.day_number}: Video matches topic '${day.title}'`);
      }
    }
  }
}

// If run directly
if (process.argv[1] && process.argv[1].endsWith('verify_youtube_topics.mjs')) {
  runVerificationCron().then(() => console.log("Verification complete."));
}
