/**
 * @jest-environment node
 */
// P0.3 — evidence-gated organization resolution (Phase 1.4).
// The resolver must never assign or create an org without evidence, and must
// reject person-name strings ("Sadia Munir") that previously polluted the data.
import { resolveOrganization, looksLikePersonName, extractBoardToken } from "@/lib/organizations/resolve";

const ORGS = [
  { id: "o1", name: "DRDO", slug: "drdo", website: "https://www.drdo.gov.in" },
  { id: "o2", name: "IIT Hyderabad", slug: "iit-hyderabad", website: "https://www.iith.ac.in" },
  { id: "o3", name: "Tenstorrent", slug: "tenstorrent", website: "https://tenstorrent.com" },
  { id: "o4", name: "NVIDIA", slug: "nvidia", website: "https://www.nvidia.com" },
  { id: "o5", name: "ISRO", slug: "isro", website: null },
];

describe("looksLikePersonName", () => {
  test("flags person names", () => {
    expect(looksLikePersonName("Sadia Munir")).toBe(true);
    expect(looksLikePersonName("Muhammad Faizan")).toBe(true);
  });
  test("does not flag real orgs", () => {
    expect(looksLikePersonName("DRDO")).toBe(false);
    expect(looksLikePersonName("Bharat Electronics Limited (BEL)")).toBe(false);
    expect(looksLikePersonName("IIT Hyderabad")).toBe(false);
    expect(looksLikePersonName("Unknown Organization")).toBe(false);
  });
});

describe("extractBoardToken", () => {
  test("greenhouse path token", () => {
    expect(extractBoardToken("https://job-boards.greenhouse.io/tenstorrent/jobs/5098932007")).toBe("tenstorrent");
  });
  test("workday first host label", () => {
    expect(extractBoardToken("https://nvidia.wd3.myworkdayjobs.com/en-US/nvidia/jobs")).toBe("nvidia");
  });
});

describe("resolveOrganization", () => {
  test("domain match assigns high-confidence id", () => {
    const r = resolveOrganization({ sourceUrl: "https://www.iith.ac.in/assets/files/careers/staff/JRF.pdf", organizations: ORGS });
    expect(r).toEqual({ name: "IIT Hyderabad", organizationId: "o2", confidence: "high" });
  });
  test("subdomain of org website matches", () => {
    const r = resolveOrganization({ sourceUrl: "https://www.drdo.gov.in/drdo/en/offerings/vacancies", title: "SSPL, Delhi JRF", organizations: ORGS });
    expect(r.organizationId).toBe("o1");
  });
  test("ATS board token matches org slug", () => {
    const r = resolveOrganization({ sourceUrl: "https://job-boards.greenhouse.io/tenstorrent/jobs/5098932007", organizations: ORGS });
    expect(r.organizationId).toBe("o3");
  });
  test("title containing a known org name is medium evidence", () => {
    const r = resolveOrganization({ title: "JRF in VLSI at IIT Hyderabad", sourceUrl: "https://drive.google.com/file/d/x", organizations: ORGS });
    expect(r.organizationId).toBe("o2");
    expect(r.confidence).toBe("medium");
  });
  test("person-name source with no evidence is rejected (never assigned)", () => {
    const r = resolveOrganization({ sourceUrl: "https://sadia-munir.jobs.lever.co/jobs/123", title: "AI Research Engineer", name: "Sadia Munir", organizations: ORGS });
    expect(r).toEqual({ name: null, organizationId: null, confidence: "none" });
  });
  test("no evidence at all resolves to none", () => {
    const r = resolveOrganization({ sourceUrl: null, title: "Untitled", name: null, organizations: ORGS });
    expect(r.confidence).toBe("none");
  });
  test("legit new org name with no table match is name-only (no id)", () => {
    const r = resolveOrganization({ sourceUrl: "https://some-unknown-startup.io/careers", name: "Quantum Fab Labs", organizations: ORGS });
    expect(r.organizationId).toBeNull();
    expect(r.name).toBe("Quantum Fab Labs");
  });
});
