/**
 * @jest-environment node
 */
// Regression tests for the scraper title normalization pipeline (QA audit P2):
// glued employment-type suffixes from ATS adapters must be split, not destroyed.
import { cleanTitle } from "@/lib/scrapers/utils";

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

  test("existing pipeline transforms still apply", () => {
    expect(cleanTitle("Invites applications for the post of Technician-A", "DRDO"))
      .toBe("Technician-A — DRDO");
  });
});