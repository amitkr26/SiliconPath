import Parser from 'rss-parser';

async function getChannelId(handle) {
  const url = `https://www.youtube.com/${handle}`;
  console.log(`Resolving handle ${handle} to channel ID via ${url}...`);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  if (!res.ok) throw new Error(`Failed to load channel page: status ${res.status}`);
  const html = await res.text();
  
  // Try finding channelId in meta tags or script blocks
  const match = html.match(/"channelId":"(UC[^"]+)"/) || html.match(/"browseId":"(UC[^"]+)"/) || html.match(/channel\/([UC][A-Za-z0-9_-]{21,23})/);
  if (match) {
    return match[1];
  }
  
  throw new Error(`Could not find channel ID for ${handle}`);
}

async function fetchLatestVideos(channelId) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  console.log(`Fetching RSS feed from ${url}...`);
  const parser = new Parser();
  const feed = await parser.parseURL(url);
  return feed.items.map(item => ({
    title: item.title,
    link: item.link,
    id: item.id.replace('yt:video:', ''),
    pubDate: item.pubDate
  }));
}

async function main() {
  try {
    const channelId = await getChannelId('@nesoacademy');
    console.log("Resolved Channel ID:", channelId);
    const videos = await fetchLatestVideos(channelId);
    console.log("Found videos:", videos.length);
    console.log("First 3 videos:", JSON.stringify(videos.slice(0, 3), null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
