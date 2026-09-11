/**
 * @jest-environment node
 */
// Regression tests for the scraper title normalization pipeline (QA audit P2):
// glued employment-type suffixes from ATS adapters must be split, not destroyed.
import { cleanTitle, GARBAGE_TITLE_PATTERNS } from "@/lib/scrapers/utils";

describe("cleanTitle — employment-type glue", () => {
  test("splits glued )Full-time suffix", () => {
    expect(cleanTitle("Full Stack Data Engineer (Data Engineering)Full-time", "Acme"))
      .toBe("Full Stack Data Engineer (Data Engineering) Full-time");
  });

  test("splits glued Part-time and Fulltime variants", () => {
    expect(cleanTitle("Lab AssistantFulltime", "Acme")).toBe("Lab Assistant Fulltime");
    expect(cleanTitle("QA Engineer(Contract)Part-time", "Acme")).toBe("QA Engineer(Contract) Part-time");
  });

  test("leaves legit titles unchanged", () => {
    expect(cleanTitle("Full-time Faculty Position at IIT", "IIT")).toBe("Full-time Faculty Position at IIT");
    expect(cleanTitle("JRF Position in VLSI Design — C-DAC", "C-DAC")).toBe("JRF Position in VLSI Design — C-DAC");
  });

  test("splits glued Intern and Internship suffixes", () => {
    expect(cleanTitle("Digital IC Verification(RTL)Intern", "Acme"))
      .toBe("Digital IC Verification(RTL) Intern");
    expect(cleanTitle("Hardware Systems(FPGA)Internship", "Acme"))
      .toBe("Hardware Systems(FPGA) Internship");
  });

  test("deduplicates redundant trailing Intern when title starts with Intern", () => {
    expect(cleanTitle("Intern - Occupational Health and SafetyIntern", "Western Digital"))
      .toBe("Intern - Occupational Health and Safety");
  });

  test("existing pipeline transforms still apply", () => {
    expect(cleanTitle("Invites applications for the post of Technician-A", "DRDO"))
      .toBe("Technician-A — DRDO");
  });
});

// ── FIX #18: GARBAGE_TITLE_PATTERNS word-boundary tests ──
// The "search" token must match the standalone word "search" but NOT the
// substring "search" inside "Research".
describe("GARBAGE_TITLE_PATTERNS — word-boundary fix (#18)", () => {
  test("standalone 'search' is matched as garbage", () => {
    expect(GARBAGE_TITLE_PATTERNS.test("search")).toBe(true);
    expect(GARBAGE_TITLE_PATTERNS.test("Search")).toBe(true);
    expect(GARBAGE_TITLE_PATTERNS.test("SEARCH")).toBe(true);
  });

  test("'search' in 'search results' is matched as garbage", () => {
    expect(GARBAGE_TITLE_PATTERNS.test("search results page")).toBe(true);
  });

  test("'Research' is NOT matched as garbage", () => {
    expect(GARBAGE_TITLE_PATTERNS.test("Temporary Research Personnel")).toBe(false);
    expect(GARBAGE_TITLE_PATTERNS.test("Research Scientist")).toBe(false);
    expect(GARBAGE_TITLE_PATTERNS.test("Research Fellow")).toBe(false);
    expect(GARBAGE_TITLE_PATTERNS.test("Research Assistant")).toBe(false);
  });

  test("'researcher' is NOT matched as garbage", () => {
    expect(GARBAGE_TITLE_PATTERNS.test("Senior Researcher")).toBe(false);
  });

  test("'searched' and 'searching' are NOT matched as garbage", () => {
    expect(GARBAGE_TITLE_PATTERNS.test("searched items")).toBe(false);
    expect(GARBAGE_TITLE_PATTERNS.test("searching for candidates")).toBe(false);
  });

  test("other garbage tokens still match correctly", () => {
    expect(GARBAGE_TITLE_PATTERNS.test("home page")).toBe(true);
    expect(GARBAGE_TITLE_PATTERNS.test("contact us")).toBe(true);
    expect(GARBAGE_TITLE_PATTERNS.test("click here")).toBe(true);
    expect(GARBAGE_TITLE_PATTERNS.test("read more")).toBe(true);
    expect(GARBAGE_TITLE_PATTERNS.test("view all posts")).toBe(true);
  });

  test("legitimate opportunity titles are NOT garbage", () => {
    expect(GARBAGE_TITLE_PATTERNS.test("JRF in VLSI Design at IIT Bombay")).toBe(false);
    expect(GARBAGE_TITLE_PATTERNS.test("Research Associate — DRDO")).toBe(false);
    expect(GARBAGE_TITLE_PATTERNS.test("Scientist/Engineer at ISRO")).toBe(false);
    expect(GARBAGE_TITLE_PATTERNS.test("PhD Fellowship in Semiconductor Physics")).toBe(false);
  });
});

// ── FIX #17: ISRO title "Read More" stripping tests ──
describe("ISRO title Read More stripping (#17)", () => {
  // Simulates the title extraction logic from isro-scraper.ts line 104
  function extractTitle(linkText: string, rowText: string): string {
    return (linkText || rowText.split("\n")[0].trim())
      .replace(/\s+/g, " ")
      .replace(/\s*Read More\s*$/i, "")
      .trim();
  }

  test("normal ISRO opportunity title preserved", () => {
    const title = extractTitle(
      "Scientist/Engineer 'SC' (Electronics)",
      "Scientist/Engineer 'SC' (Electronics) Some description text here"
    );
    expect(title).toBe("Scientist/Engineer 'SC' (Electronics)");
    expect(title).not.toMatch(/Read More/i);
  });

  test("'Read More' suffix stripped from title", () => {
    const title = extractTitle(
      "Temporary Research Personnel Read More",
      "Temporary Research Personnel Read More Full description here"
    );
    expect(title).toBe("Temporary Research Personnel");
    expect(title).not.toMatch(/Read More/i);
  });

  test("multiple spaces around Read More handled", () => {
    const title = extractTitle(
      "JRF in VLSI Design   Read More  ",
      "JRF in VLSI Design   Read More  Description"
    );
    expect(title).toBe("JRF in VLSI Design");
  });

  test("Read More in middle of title is NOT stripped", () => {
    // Edge case: if "Read More" appears mid-title (unlikely but defensive)
    const title = extractTitle(
      "Click to Read More about JRF Position",
      "Click to Read More about JRF Position"
    );
    expect(title).toBe("Click to Read More about JRF Position");
  });

  test("title without Read More passes through unchanged", () => {
    const title = extractTitle(
      "Scientist/Engineer 'SE' (Computer Science)",
      "Scientist/Engineer 'SE' (Computer Science) Apply now"
    );
    expect(title).toBe("Scientist/Engineer 'SE' (Computer Science)");
  });

  test("Read More at different cases stripped", () => {
    expect(extractTitle("JRF Position Read more", "desc")).toBe("JRF Position");
    expect(extractTitle("SRF Position READ MORE", "desc")).toBe("SRF Position");
    expect(extractTitle("PhD Position  read more  ", "desc")).toBe("PhD Position");
  });
});