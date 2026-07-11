import * as cheerio from "cheerio";

async function main() {
  console.log("=== Querying live HTML /opportunities ===");
  try {
    const res = await fetch("https://siliconpath.vercel.app/opportunities");
    const html = await res.text();
    console.log("HTML Status:", res.status);
    
    const $ = cheerio.load(html);
    const titles = [];
    
    // Let's find all opportunity cards
    // In our code, OpportunityCard titles might be in h3 or similar headings
    $("h3").each((_, el) => {
      titles.push($(el).text().trim());
    });

    console.log(`Found ${titles.length} h3 headers:`);
    titles.slice(0, 15).forEach((t, i) => console.log(`  h3[${i}]: "${t}"`));

    // Let's search the HTML body for "Payment Gateway", "At a Glance", "NVIDIA"
    console.log("\nSearching HTML string contents:");
    const hasPayment = html.toLowerCase().includes("payment gateway");
    const hasAtAGlance = html.toLowerCase().includes("at a glance");
    const hasNvidia = html.toLowerCase().includes("nvidia");
    const hasIsro = html.toLowerCase().includes("isro");
    
    console.log("  Contains 'payment gateway':", hasPayment);
    console.log("  Contains 'at a glance':", hasAtAGlance);
    console.log("  Contains 'nvidia':", hasNvidia);
    console.log("  Contains 'isro':", hasIsro);

    // Let's also check if there's any Next.js JSON data (__NEXT_DATA__)
    const nextDataScript = $("#__NEXT_DATA__").html();
    if (nextDataScript) {
      console.log("\n__NEXT_DATA__ found!");
      const data = JSON.parse(nextDataScript);
      console.log("Props keys:", Object.keys(data.props?.pageProps || {}));
    } else {
      // In App Router, it uses RSC payloads. Let's check for scripts with id or type
      console.log("\nChecking for App Router state payloads...");
      const scripts = [];
      $("script").each((_, s) => {
        const text = $(s).text();
        if (text.includes("payment gateway") || text.includes("isro")) {
          scripts.push(text.substring(0, 200) + "...");
        }
      });
      console.log(`Found ${scripts.length} matching scripts.`);
    }

  } catch (e) {
    console.error("Error:", e.message);
  }
}

main().catch(console.error);
