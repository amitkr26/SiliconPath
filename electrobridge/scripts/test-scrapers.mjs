import * as cheerio from "cheerio";

const ISRO_URL = "https://www.isro.gov.in/Careers.html";
const DRDO_URL = "https://drdo.gov.in/drdo/en/offerings/vacancies";
const CSIR_URL = "https://www.csir.res.in/en/career-opportunities/recruitment";

async function findElements($, label) {
  const results = [];
  $("*").each((i, el) => {
    const text = $(el).text().trim();
    const tag = el.tagName;
    const cls = $(el).attr("class") || "";
    const id = $(el).attr("id") || "";
    if (
      text.length > 30 &&
      text.length < 500 &&
      !results.some((r) => r.text === text) &&
      (text.includes("JRF") ||
        text.includes("Fellow") ||
        text.includes("Scientist") ||
        text.includes("Recruitment") ||
        text.includes("Advt") ||
        text.includes("Vacanc"))
    ) {
      results.push({ tag, cls: cls.slice(0, 60), id, text: text.slice(0, 150) });
    }
  });
  console.log(`\n=== ${label} (${results.length} matches) ===`);
  results.slice(0, 10).forEach((r, i) => {
    console.log(`  ${i + 1}. <${r.tag}> class="${r.cls}"`);
    console.log(`     "${r.text}"`);
  });
}

const isroRes = await fetch(ISRO_URL, {
  signal: AbortSignal.timeout(15000),
  headers: { "User-Agent": "Mozilla/5.0" },
});
const $1 = cheerio.load(await isroRes.text());
await findElements($1, "ISRO");

const drdoRes = await fetch(DRDO_URL, {
  signal: AbortSignal.timeout(15000),
  headers: { "User-Agent": "Mozilla/5.0" },
});
const $2 = cheerio.load(await drdoRes.text());
await findElements($2, "DRDO");

const csirRes = await fetch(CSIR_URL, {
  signal: AbortSignal.timeout(15000),
  headers: { "User-Agent": "Mozilla/5.0" },
});
const $3 = cheerio.load(await csirRes.text());
await findElements($3, "CSIR");
