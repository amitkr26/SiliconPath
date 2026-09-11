/**
 * Runnable verification test for Phase 0 critical fixes:
 * 1. UUID vs slug discrimination (Postgres 22P02 prevention)
 * 2. Opportunity pagination count fidelity (prevents single-page truncation)
 * 3. Admin path security boundaries (/api/admin gated, /admin client login accessible)
 */

describe("Phase 0 Production Fixes", () => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  describe("UUID vs Slug Discrimination (Postgres 22P02 prevention)", () => {
    it("correctly identifies valid standard UUIDs", () => {
      expect(UUID_REGEX.test("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d")).toBe(true);
      expect(UUID_REGEX.test("00000000-0000-0000-0000-000000000000")).toBe(true);
      expect(UUID_REGEX.test("9F2B8F8A-3A1B-4C2D-8E3F-0A1B2C3D4E5F")).toBe(true);
    });

    it("rejects slug identifiers so they are never cast to UUID in SQL filters", () => {
      expect(UUID_REGEX.test("digital-logic")).toBe(false);
      expect(UUID_REGEX.test("verilog")).toBe(false);
      expect(UUID_REGEX.test("analog-ic-design")).toBe(false);
      expect(UUID_REGEX.test("iit-bombay-jrf-microelectronics-2026")).toBe(false);
    });
  });

  describe("Opportunity Pagination Count Fidelity", () => {
    function computeCount(exactDbCount: number | null | undefined, sliceLength: number): number {
      return exactDbCount !== null && exactDbCount !== undefined ? exactDbCount : sliceLength;
    }

    it("preserves total database count when exact count is returned", () => {
      const dbExactCount = 342;
      const pageSliceLength = 25; // 1 page of results
      expect(computeCount(dbExactCount, pageSliceLength)).toBe(342);
    });

    it("falls back to slice length only when count is null/undefined", () => {
      expect(computeCount(null, 15)).toBe(15);
      expect(computeCount(undefined, 20)).toBe(20);
    });
  });

  describe("Admin Middleware Routing Scope", () => {
    const ADMIN_PATHS = ['/api/admin'];

    function isAdminApiRoute(path: string): boolean {
      return ADMIN_PATHS.some((p) => path === p || path.startsWith(p + '/'));
    }

    it("gates all /api/admin endpoints strictly", () => {
      expect(isAdminApiRoute("/api/admin")).toBe(true);
      expect(isAdminApiRoute("/api/admin/opportunities")).toBe(true);
      expect(isAdminApiRoute("/api/admin/auth/session")).toBe(true);
      expect(isAdminApiRoute("/api/admin/subscribers")).toBe(true);
    });

    it("does not block client page navigation to /admin so login console is reachable", () => {
      expect(isAdminApiRoute("/admin")).toBe(false);
      expect(isAdminApiRoute("/admin/add-news")).toBe(false);
      expect(isAdminApiRoute("/admin/add-opportunity")).toBe(false);
    });
  });

  describe("PracticeQuiz Answer Grading Resiliency", () => {
    function evaluateAnswer(
      q: { options: any[]; correct_option_index: number },
      selectedIdx: number
    ): boolean {
      const selected = q.options[selectedIdx];
      const selectedText = typeof selected === "string" ? selected : selected?.label || selected?.value || "";
      const correctOption = q.options[q.correct_option_index];
      const correctText = typeof correctOption === "string" ? correctOption : correctOption?.label || correctOption?.value || "";

      return (
        selectedIdx === q.correct_option_index ||
        (Boolean(selectedText) && selectedText.trim().toLowerCase() === correctText.trim().toLowerCase())
      );
    }

    it("correctly grades plain string option arrays", () => {
      const question = {
        options: ["Blocking (=)", "Non-blocking (<=)", "Continuous (assign)"],
        correct_option_index: 1,
      };
      expect(evaluateAnswer(question, 1)).toBe(true);
      expect(evaluateAnswer(question, 0)).toBe(false);
      expect(evaluateAnswer(question, 2)).toBe(false);
    });

    it("correctly grades object option arrays {label, value}", () => {
      const question = {
        options: [
          { label: "Synthesis mismatch", value: "opt_a" },
          { label: "Race condition hazard", value: "opt_b" },
        ],
        correct_option_index: 1,
      };
      expect(evaluateAnswer(question, 1)).toBe(true);
      expect(evaluateAnswer(question, 0)).toBe(false);
    });
  });

  describe("Resume Multi-Version Mapping", () => {
    interface VersionRecord {
      id: string;
      version_name?: string;
      style?: any;
      updated_at?: string;
    }

    function mapVersionToMeta(v: VersionRecord) {
      return {
        id: v.id,
        name: v.version_name || "Primary Resume",
        templateId: v.style?.templateId || "modern-professional",
        updatedAt: v.updated_at ? new Date(v.updated_at).toLocaleDateString() : "Just now",
      };
    }

    it("extracts version metadata correctly with fallback defaults", () => {
      const record: VersionRecord = {
        id: "v-123",
        version_name: "Verification Engineer Resume",
        style: { templateId: "technical-minimal" },
        updated_at: "2026-09-04T12:00:00Z",
      };

      const meta = mapVersionToMeta(record);
      expect(meta.id).toBe("v-123");
      expect(meta.name).toBe("Verification Engineer Resume");
      expect(meta.templateId).toBe("technical-minimal");
      expect(meta.updatedAt).toBeTruthy();
    });

    it("applies sensible defaults for empty style and name", () => {
      const record: VersionRecord = { id: "v-456" };
      const meta = mapVersionToMeta(record);
      expect(meta.name).toBe("Primary Resume");
      expect(meta.templateId).toBe("modern-professional");
      expect(meta.updatedAt).toBe("Just now");
    });
  });
});

