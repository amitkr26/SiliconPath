import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(path.resolve(process.cwd(), "frontend/package.json"));
const { createClient } = require("@supabase/supabase-js");

// Read environment variables
const env = {};
const envPath = path.resolve(process.cwd(), "frontend/.env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      env[m[1].trim()] = val;
    }
  });
}

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
const supabaseKey = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local");
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = "organization-logos";

// Curated dictionary of verified high-res logos (vector SVGs / official PNGs)
export const VERIFIED_LOGO_FILES = {
  // ── Global Semiconductor & Computing Giants ──
  "amd": ["AMD Logo.svg"],
  "analog-devices": ["Analog Devices Logo.svg"],
  "annapurna-labs": ["Amazon Web Services Logo.svg"],
  "ansys": ["Ansys logo (2019).svg", "Ansys logo.svg"],
  "apple-silicon": ["Apple logo black.svg"],
  "applied-materials": ["Applied Materials Logo.svg", "Applied Materials logo.svg"],
  "arm": ["Arm logo 2017.svg"],
  "asml": ["ASML Holding N.V. logo.svg"],
  "broadcom": ["Broadcom Logo.svg"],
  "cadence": ["Cadence-Logo.svg"],
  "globalfoundries": ["GlobalFoundries logo.svg"],
  "google-silicon": ["Google 2015 logo.svg"],
  "infineon": ["Infineon-Logo.svg"],
  "intel": ["Intel logo 2023.svg"],
  "keysight": ["Keysight Logo.svg"],
  "kioxia": ["Kioxia.svg"],
  "kla": ["KLA Corp. logo.svg"],
  "lam-research": ["Lam Research logo.svg"],
  "marvell": ["Marvell Logo.svg"],
  "mediatek": ["MediaTek Logo wiki.svg"],
  "meta-mtia": ["Meta Platforms Inc. logo.svg"],
  "microchip": ["Microchip logo.svg"],
  "micron": ["Micron Technology logo 2024.svg"],
  "microsoft-silicon": ["Microsoft logo (2012).svg"],
  "nvidia": ["NVIDIA logo.svg"],
  "nxp": ["NXP Semiconductors logo 2023.svg"],
  "onsemi": ["onsemi logo 2021.svg", "ON Semiconductor logo.svg"],
  "qualcomm": ["Qualcomm-Logo.svg"],
  "renesas": ["Renesas Electronics logo.svg"],
  "samsung-semi": ["Samsung Logo.svg"],
  "siemens-eda": ["Siemens-logo.svg"],
  "sifive": ["SiFive Logo.svg"],
  "sk-hynix": ["SK Hynix.svg"],
  "stmicro": ["ST_logo_2020_blue_V.svg", "STMicroelectronics logo.svg"],
  "synopsys": ["Synopsys Logo.svg"],
  "ti": ["Texas Instruments logo 2024.svg"],
  "tokyo-electron": ["Tokyo Electron logo.svg"],
  "tsmc": ["Tsmc.svg"],
  "western-digital": ["WD Logo.svg"],
  "wolfspeed": ["Wolfspeed logo.svg"],

  // ── Indian Government, Strategic & Premier R&D Labs ──
  "barc": ["Bhabha Atomic Research Centre Logo.png"],
  "csir": ["CSIR-Logo-With-Tagline-Seleceted-Bilingual.png"],
  "csir-ceeri": ["CSIR-Logo-With-Tagline-Seleceted-Bilingual.png"],
  "csir-hrdg": ["CSIR-Logo-With-Tagline-Seleceted-Bilingual.png"],
  "drdo": ["Defence Research and Development Organisation.svg"],
  "isro": ["Indian Space Research Organisation Logo.svg"],
  "scl-chandigarh": ["Indian Space Research Organisation Logo.svg"],
  "icmr-indian-council-of-medical-research": ["Indian Council of Medical Research Logo.svg"],
  "indian-railways-central-recruitment": ["Indian railways 18 star logo.jpg", "Indian Railways logo.svg"],
  "ncbs-national-centre-for-biological-sciences": ["National_Centre_for_Biological_Sciences_Logo.png"],

  // ── International Research Institutes ──
  "astar-ime": ["A*STAR logo.png"],
  "imec": ["LOGO-IMEC black.svg"],
  "itri": ["ITRI eng logo.png"],

  // ── Premier Indian Academia ──
  "bits-pilani": ["BITS Pilani-Logo.svg"],
  "iiit-hyderabad": ["International Institute of Information Technology, Hyderabad logo.png"],
  "iisc": ["Indian Institute of Science 2019 logo.svg"],
  "iiser-bhopal": ["IISERBlogo.png"],
  "iist": ["Indian Institute of Space Science and Technology Wordmark Logo.svg"],
  "iit-bombay": ["Indian Institute of Technology Bombay Logo.svg"],
  "iit-delhi": ["Indian Institute of Technology Delhi Logo.svg"],
  "iit-kgp": ["IIT Kharagpur Logo.svg"],
  "iit-madras": ["IIT Madras Logo.svg"],
  "iit-roorkee": ["Indian Institute of Technology Roorkee Logo.svg"],
  "nit-warangal": ["National Institute of Technology, Warangal logo.png"],

  // ── Premier Global Academia & International Orgs ──
  "epfl": ["Logo EPFL 2019.svg"],
  "eth-zurich": ["ETH Zürich Logo black.svg"],
  "georgia-tech": ["Georgia Tech logo.svg"],
  "kaist": ["KAIST logo.svg"],
  "ku-leuven": ["KU Leuven logo.svg"],
  "mit": ["MIT 2023 red logo.svg"],
  "ntu-singapore": ["Nanyang Technological University coat of arms vector.svg"],
  "nus": ["NUS coat of arms.svg"],
  "nycu": ["NYCU (國立陽明交通大學) Blue Logo.png"],
  "purdue": ["Purdue Boilermakers logo.svg"],
  "stanford": ["Stanford wordmark (2012).svg"],
  "technion": ["Technion logo.svg"],
  "tsinghua": ["Tsinghua University Logo.svg"],
  "tu-delft": ["Delft_University_of_Technology_logo.svg"],
  "tu-munich": ["Logo of the Technical University of Munich.svg"],
  "uc-berkeley": ["University of California, Berkeley Logo 2024.svg"],
  "university-of-tokyo": ["University of Tokyo logo (2024).svg"],
  "daad": ["DAAD Logo.svg"],
  "mext-japan": ["Symbol of Ministry of Education, Culture, Sports, Science and Technology of Japan.svg"],
};

// Internal/Test orgs that deliberately have no fake logos and use monograms
const INTERNAL_ORGS = new Set([
  "advanced-silicon-research-labs",
  "excompany",
  "silicon-testing-labs",
  "siliconpath",
  "siliconpath-analog-labs",
  "siliconpath-verification-labs",
]);

// Domain overrides for Google Favicon high-res fallback
const DOMAIN_MAP = {
  "cdac": "cdac.in",
  "sameer": "sameer.gov.in",
  "cea-leti": "leti-cea.com",
  "fraunhofer": "fraunhofer.de",
  "diat": "diat.ac.in",
  "iit-palakkad": "iitpkd.ac.in",
  "nit-trichy": "nitt.edu",
  "kaust": "kaust.edu.sa",
  "uc-berkeley": "berkeley.edu",
  "university-of-tokyo": "u-tokyo.ac.jp",
  "mext-japan": "mext.go.jp",
  "railtel": "railtelindia.com",
  "railtel-corporation-of-india": "railtelindia.com",
  "indian-railways-central-recruitment": "indianrailways.gov.in",
  "cerebras": "cerebras.net",
  "groq": "groq.com",
  "graphcore": "graphcore.ai",
  "tenstorrent": "tenstorrent.com",
  "ampere": "amperecomputing.com",
};

async function fetchFromWikimedia(filename) {
  const enc = encodeURIComponent(filename);
  const endpoints = [
    `https://en.wikipedia.org/wiki/Special:FilePath/${enc}?width=300`,
    `https://commons.wikimedia.org/wiki/Special:FilePath/${enc}?width=300`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "BerojgarDegreeWala/1.0 (https://berojgardegreewala.vercel.app; info@berojgardegreewala.dev)",
        },
        redirect: "follow",
      });
      if (res.ok) {
        const ct = res.headers.get("content-type") || "image/png";
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 500 && !ct.includes("text/html")) {
          return { buffer: buf, contentType: ct.includes("svg") ? "image/svg+xml" : "image/png", ext: "png" };
        }
      }
    } catch {
      // try next
    }
  }
  return null;
}

async function fetchFaviconFallback(domain) {
  if (!domain) return null;
  try {
    const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      // Google returns a 726-byte gray globe for domains without icons; require > 800 bytes
      if (buf.length > 800) {
        return { buffer: buf, contentType: "image/png", ext: "png" };
      }
    }
  } catch {
    // fallback
  }
  return null;
}

export async function backfillLogos(options = {}) {
  const isDryRun = options.dryRun ?? process.argv.includes("--dry-run");
  console.log(`=== BerojgarDegreeWala Official Logo Backfill ===`);
  console.log(`Mode: ${isDryRun ? "DRY RUN (no storage or DB changes)" : "LIVE EXECUTION"}`);

  const { data: orgs, error } = await sb
    .from("organizations")
    .select("id, name, slug, website, logo_url, is_verified")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch organizations:", error.message);
    return;
  }

  console.log(`Found ${orgs.length} organizations in database.`);

  const stats = {
    total: orgs.length,
    uploaded: 0,
    skippedInternal: 0,
    fallbackMonogram: 0,
    alreadyHasLogo: 0,
    errors: 0,
  };

  const results = [];

  for (const org of orgs) {
    const slug = org.slug;

    if (INTERNAL_ORGS.has(slug)) {
      stats.skippedInternal++;
      results.push({ slug, name: org.name, action: "skip", reason: "internal/test organization (monogram fallback)" });
      continue;
    }

    // Check verified dictionary
    let asset = null;
    const candidates = VERIFIED_LOGO_FILES[slug] || [];
    for (const c of candidates) {
      asset = await fetchFromWikimedia(c);
      if (asset) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    // If not found in verified dictionary, try domain fallback
    if (!asset) {
      let domain = DOMAIN_MAP[slug];
      if (!domain && org.website) {
        try {
          domain = new URL(org.website).hostname.replace(/^www\./, "");
        } catch {}
      }
      if (domain) {
        asset = await fetchFaviconFallback(domain);
      }
    }

    if (!asset) {
      stats.fallbackMonogram++;
      results.push({ slug, name: org.name, action: "monogram", reason: "no verified asset found (deterministic monogram)" });
      continue;
    }

    const storagePath = `${slug}.${asset.ext}`;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;

    if (isDryRun) {
      stats.uploaded++;
      results.push({
        slug,
        name: org.name,
        action: "dry-run-success",
        size: asset.buffer.length,
        contentType: asset.contentType,
        targetUrl: publicUrl,
      });
      console.log(`[DRY-RUN] ${slug} -> ${publicUrl} (${asset.buffer.length}b)`);
    } else {
      // 1. Upload to Supabase Storage
      const { error: uploadErr } = await sb.storage.from(BUCKET_NAME).upload(storagePath, asset.buffer, {
        contentType: asset.contentType,
        upsert: true,
      });

      if (uploadErr) {
        stats.errors++;
        console.error(`[UPLOAD-ERR] ${slug}:`, uploadErr.message);
        results.push({ slug, name: org.name, action: "upload-error", error: uploadErr.message });
        continue;
      }

      // 2. Update database logo_url (preserving is_verified strictly!)
      const { error: updateErr } = await sb
        .from("organizations")
        .update({ logo_url: publicUrl })
        .eq("id", org.id);

      if (updateErr) {
        stats.errors++;
        console.error(`[DB-ERR] ${slug}:`, updateErr.message);
        results.push({ slug, name: org.name, action: "db-error", error: updateErr.message });
        continue;
      }

      stats.uploaded++;
      results.push({
        slug,
        name: org.name,
        action: "updated",
        size: asset.buffer.length,
        publicUrl,
      });
      console.log(`[UPDATED] ${slug} -> ${publicUrl}`);
    }

    // Rate-limiting courtesy pause
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\n=== Backfill Summary ===`);
  console.log(`Total organizations: ${stats.total}`);
  console.log(`Uploaded / Linked to Supabase: ${stats.uploaded}`);
  console.log(`Skipped internal/test: ${stats.skippedInternal}`);
  console.log(`Fallback monograms: ${stats.fallbackMonogram}`);
  console.log(`Errors: ${stats.errors}`);

  return { stats, results };
}

if (process.argv[1].endsWith("backfill-org-logos.mjs")) {
  backfillLogos();
}
