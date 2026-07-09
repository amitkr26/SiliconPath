const puppeteer = require('puppeteer');
const fs = require('fs');

async function runTests() {
  console.log("Starting Live Testing Pass...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  const report = [];
  
  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      report.push(`[CONSOLE ERROR] on ${page.url()}: ${msg.text()}`);
    }
  });

  try {
    // 1. Homepage
    console.log("Testing Homepage...");
    await page.goto('https://siliconpath.vercel.app/', { waitUntil: 'networkidle2' });
    const homepageContent = await page.content();
    if (homepageContent.includes('Featured Opportunities')) {
      report.push("[Homepage] 'Featured Opportunities' section loads.");
    } else {
      report.push("[Homepage] 'Featured Opportunities' section MISSING.");
    }
    
    // 2. /opportunities
    console.log("Testing /opportunities...");
    await page.goto('https://siliconpath.vercel.app/opportunities', { waitUntil: 'networkidle2' });
    // Let's click a filter if possible, or just fetch the DOM
    const oppsContent = await page.content();
    report.push(`[Opportunities] Loaded. Page length: ${oppsContent.length}`);
    
    // 3. Opportunity detail
    console.log("Testing /opportunities detail...");
    // Find a link to an opportunity
    const detailLinks = await page.$$eval('a[href^="/opportunities/"]', links => links.map(a => a.href));
    if (detailLinks.length > 0) {
      await page.goto(detailLinks[0], { waitUntil: 'networkidle2' });
      const detailContent = await page.content();
      if (detailContent.includes('Analyzing...')) {
        report.push("[Opportunity Detail] AI Panel is stuck on 'Analyzing...'");
      } else if (detailContent.includes('AI Analysis')) {
        report.push("[Opportunity Detail] AI Panel loaded successfully.");
      } else {
        report.push("[Opportunity Detail] AI Panel missing entirely.");
      }
    } else {
      report.push("[Opportunity Detail] Could not find any opportunity links to click.");
    }

    // 4. /news
    console.log("Testing /news...");
    await page.goto('https://siliconpath.vercel.app/news', { waitUntil: 'networkidle2' });
    const newsText = await page.$$eval('article, .news-card, h3', els => els.map(e => e.innerText).join(' '));
    if (newsText.toLowerCase().includes("tom's hardware") || newsText.toLowerCase().includes("gaming") || newsText.toLowerCase().includes("gpu")) {
      report.push("[News] Contamination found (Gaming/Consumer Hardware topics).");
    } else {
      report.push("[News] Seems relevant to VLSI/Semiconductors.");
    }
    if (newsText.includes("tktk")) {
      report.push("[News] 'tktk' placeholder text leaked into production.");
    }

    // 5. /organizations
    console.log("Testing /organizations...");
    await page.goto('https://siliconpath.vercel.app/organizations', { waitUntil: 'networkidle2' });
    const orgsText = await page.$$eval('h3, h2', els => els.map(e => e.innerText));
    // Check for personal names (Sadia Munir, Muhammad Faizan, etc)
    const badOrgs = orgsText.filter(name => name.includes('Sadia') || name.includes('Muhammad') || name.includes('Faizan'));
    if (badOrgs.length > 0) {
      report.push(`[Organizations] Found person names misattributed as organizations: ${badOrgs.join(', ')}`);
    } else {
      report.push("[Organizations] Clean.");
    }

    // 8. /academy
    console.log("Testing /academy...");
    await page.goto('https://siliconpath.vercel.app/academy', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000)); // wait for client-side load
    const academyContent = await page.content();
    if (academyContent.includes('Track 1') || academyContent.includes('Verified Resources')) {
      report.push("[Academy] Content renders correctly.");
    } else if (academyContent.includes('Designing your custom VLSI strategy')) {
      report.push("[Academy] STUCK in loading state.");
    } else {
      report.push("[Academy] Unknown state. Content: " + academyContent.substring(0, 100));
    }

    // 10. /signup
    console.log("Testing /signup...");
    await page.goto('https://siliconpath.vercel.app/signup', { waitUntil: 'networkidle2' });
    const signupContent = await page.content();
    if (signupContent.includes('ElectroBridge')) {
      report.push("[Signup] 'ElectroBridge' old branding is leaking.");
    } else {
      report.push("[Signup] Branding looks okay (no ElectroBridge).");
    }

  } catch (err) {
    report.push(`[SCRIPT ERROR] ${err.message}`);
  } finally {
    await browser.close();
  }

  fs.writeFileSync('live_test_results.txt', report.join('\n'));
  console.log("Testing complete. Results saved to live_test_results.txt");
}

runTests();
