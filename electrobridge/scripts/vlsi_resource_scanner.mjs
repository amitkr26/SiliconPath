import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';

// Load .env.local manually before importing database clients
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
      if (match) {
        let key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
    console.log("Loaded environment variables from .env.local");
  }
} catch (e) {
  console.warn("Failed to load .env.local:", e.message);
}

// Now import database and AI clients
const { db1 } = await import('../src/lib/db/index.js');
const { callAI } = await import('../src/lib/ai/providers.js');

// List of top channels to scan (subset for testing/seeding)
const TARGET_CHANNELS = [
  { handle: '@nesoacademy', name: 'Neso Academy', topic: 'Digital Logic' },
  { handle: '@explore_vlsi', name: 'Explore VLSI', topic: 'Verilog / SystemVerilog' },
  { handle: '@vlsiforall', name: 'VLSI For All', topic: 'VLSI' },
  { handle: '@thesiliconsandbox', name: 'The Silicon Sandbox', topic: 'VLSI' },
  { handle: '@vlsiexcellence', name: 'VLSI Excellence', topic: 'UVM / SV' }
];

const TRUSTED_CHANNELS = ['Neso Academy', 'NPTEL'];

async function getChannelId(handle) {
  const url = `https://www.youtube.com/${handle}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  const html = await res.text();
  const match = html.match(/"channelId":"(UC[^"]+)"/) || html.match(/"browseId":"(UC[^"]+)"/) || html.match(/channel\/([UC][A-Za-z0-9_-]{21,23})/);
  if (match) return match[1];
  throw new Error(`Could not find channel ID`);
}

async function fetchLatestVideos(channelId) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const parser = new Parser();
  const feed = await parser.parseURL(url);
  return feed.items.map(item => ({
    title: item.title,
    url: item.link,
    id: item.id.replace('yt:video:', ''),
    pubDate: item.pubDate
  }));
}

async function scoreVideo(video, channelName) {
  if (TRUSTED_CHANNELS.includes(channelName)) {
    return {
      topic_tags: ['Digital Logic', 'Semiconductor'],
      relevance_score: 10,
      clarity_score: 10,
      outdated_flag: false,
      suggested_difficulty: 'beginner'
    };
  }

  const prompt = `Evaluate this YouTube video for a VLSI and semiconductor learning platform:
Title: "${video.title}"
Channel: "${channelName}"

Provide a JSON response matching this schema:
{
  "topic_tags": ["tag1", "tag2"],
  "relevance_score": 1-10,
  "clarity_score": 1-10,
  "outdated_flag": false,
  "suggested_difficulty": "beginner|intermediate|advanced"
}`;

  try {
    const response = await callAI(prompt, "You are a helpful assistant that returns ONLY strict JSON format data.", {
      temperature: 0.1
    });
    // clean markdown JSON blocks if present
    const cleanJson = response.text.replace(/```json/i, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI scoring failed, using defaults:", error.message);
    return {
      topic_tags: ['VLSI'],
      relevance_score: 5,
      clarity_score: 5,
      outdated_flag: false,
      suggested_difficulty: 'intermediate'
    };
  }
}

async function run() {
  console.log("=== Starting VLSI Resource Scanner ===");
  if (!db1) {
    console.error("Database connection db1 not available.");
    return;
  }

  for (const item of TARGET_CHANNELS) {
    try {
      console.log(`\nProcessing ${item.name} (${item.handle})...`);
      const channelId = await getChannelId(item.handle);
      console.log(`-> Channel ID: ${channelId}`);
      const videos = await fetchLatestVideos(channelId);
      console.log(`-> Found ${videos.length} videos`);

      // Slice to top 2 videos for fast sample run
      const sample = videos.slice(0, 2);
      for (const v of sample) {
        console.log(`   - Scoring video: "${v.title}"`);
        const scores = await scoreVideo(v, item.name);
        console.log(`     AI Result:`, JSON.stringify(scores));

        const isTrusted = TRUSTED_CHANNELS.includes(item.name);
        const status = isTrusted ? 'verified' : 'unverified';

        // Insert into resource_bank
        const { error } = await db1.from('resource_bank').upsert([{
          topic_tag: scores.topic_tags[0] || item.topic,
          resource_type: 'video',
          url: v.url,
          channel_name: item.name,
          channel_url: `https://www.youtube.com/channel/${channelId}`,
          quality_score: (scores.relevance_score + scores.clarity_score) / 2,
          difficulty_level: scores.suggested_difficulty,
          status: status,
          last_checked_at: new Date().toISOString()
        }], { onConflict: 'url' });

        if (error) {
          console.error(`     Failed to insert resource:`, error.message);
        } else {
          console.log(`     Successfully saved to resource_bank (status: ${status})`);
        }
      }
    } catch (err) {
      console.error(`Error scanning ${item.name}:`, err.message);
    }
  }

  console.log("\n=== Resource Scanner completed successfully ===");
}

run();
