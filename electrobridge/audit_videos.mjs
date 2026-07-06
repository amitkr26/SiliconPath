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
      return titleMatch[1].replace(' - YouTube', '').trim();
    }
    return "Unknown Title (Could not parse)";
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

async function audit() {
  console.log("Fetching tracks and days...");
  const { data: tracks } = await supabase.from('learning_tracks').select('id, name');
  if (!tracks) return console.log("No tracks found");

  const report = [];

  for (const track of tracks) {
    console.log(`\nTrack: ${track.name}`);
    const { data: days } = await supabase.from('learning_days').select('*').eq('track_id', track.id).order('day_number');
    
    if (!days || days.length === 0) {
      console.log("  No days found.");
      continue;
    }

    for (const day of days) {
      const videoId = day.video_ref;
      let actualTitle = "No video_ref";
      
      if (videoId) {
        actualTitle = await fetchYoutubeTitle(videoId);
      }
      
      report.push({
        Track: track.name,
        Day: day.day_number,
        Topic: day.title,
        StoredVideoID: videoId,
        ActualVideoTitle: actualTitle
      });
      
      console.log(`  Day ${day.day_number}: ${day.title}`);
      console.log(`    -> Video ID: ${videoId}`);
      console.log(`    -> Actual Title: ${actualTitle}`);
    }
  }

  fs.writeFileSync('audit_report.json', JSON.stringify(report, null, 2));
  console.log("\nAudit complete. Saved to audit_report.json");
}

audit();
