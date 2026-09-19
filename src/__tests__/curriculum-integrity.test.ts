import { LEARNING_PATHS } from "../lib/academy/all-paths";
import { VIDEO_COURSES, videoCoursesForAcademy } from "../lib/video-references";
import sitemap from "../app/sitemap";
import { designTokens } from "../styles/design-tokens";

const ACADEMY_TRACK_SLUGS = [
  "digital-logic",
  "verilog",
  "systemverilog",
  "uvm",
  "rtl-design",
  "physical-design",
  "interview-prep",
];

describe("SiliconPath Curriculum & Architecture Integrity", () => {
  test("contains exactly 15 learning paths", () => {
    expect(LEARNING_PATHS.length).toBe(15);
  });

  test("each learning path has unique slug and valid metadata", () => {
    const slugs = new Set<string>();
    LEARNING_PATHS.forEach((path) => {
      expect(slugs.has(path.slug)).toBe(false);
      slugs.add(path.slug);
      expect(path.title).toBeTruthy();
      expect(path.description).toBeTruthy();
      expect(["foundations", "backend", "tools-career"]).toContain(path.category);
      expect(["Beginner", "Intermediate", "Advanced", "All levels"]).toContain(path.level);
      expect(path.modules.length).toBeGreaterThan(0);
      expect(path.moduleCount).toBe(path.modules.length);

      // Verify each module within the path
      const moduleSlugs = new Set<string>();
      path.modules.forEach((mod) => {
        expect(moduleSlugs.has(mod.slug)).toBe(false);
        moduleSlugs.add(mod.slug);
        expect(mod.title).toBeTruthy();
        expect(mod.duration).toBeTruthy();
      });
    });
  });

  test("sitemap includes all static surfaces and learning paths", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);

    // Core static routes
    expect(urls).toContain("https://siliconpath.in");
    expect(urls).toContain("https://siliconpath.in/about");
    expect(urls).toContain("https://siliconpath.in/learn");
    expect(urls).toContain("https://siliconpath.in/learn/video-courses");
    expect(urls).toContain("https://siliconpath.in/academy");
    expect(urls).toContain("https://siliconpath.in/engineering-lab");
    expect(urls).toContain("https://siliconpath.in/sta-interview-questions");
    expect(urls).toContain("https://siliconpath.in/courses");
    expect(urls).toContain("https://siliconpath.in/resources");
    expect(urls).toContain("https://siliconpath.in/courses/openlane-rtl-to-gds");
    expect(urls).toContain("https://siliconpath.in/courses/resume-tips");

    // All 15 learning paths in sitemap
    LEARNING_PATHS.forEach((path) => {
      expect(urls).toContain(`https://siliconpath.in/learn/${path.slug}`);
    });
  });

  test("video course references are well-formed and map to real paths", () => {
    const pathSlugs = new Set(LEARNING_PATHS.map((p) => p.slug));
    expect(VIDEO_COURSES.length).toBeGreaterThanOrEqual(70);

    VIDEO_COURSES.forEach((c) => {
      expect(c.title).toBeTruthy();
      expect(c.institute).toBeTruthy();
      expect(c.paths.every((p) => pathSlugs.has(p))).toBe(true);
      if (c.source === "nptel") {
        expect(c.id).toMatch(/^\d{9}$/);
        expect(c.url).toMatch(/^https:\/\/nptel\.ac\.in\/courses\/\d{9}$/);
      } else {
        expect(c.url).toMatch(/^https:\/\/www\.youtube\.com\/playlist\?list=[A-Za-z0-9_-]{20,}$/);
      }
    });
  });

  test("every academy track maps to embedded video references and all tags are valid", () => {
    ACADEMY_TRACK_SLUGS.forEach((slug) => {
      const refs = videoCoursesForAcademy(slug);
      expect(refs.length).toBeGreaterThan(0); // every track has at least one embedded source
      refs.forEach((c) => {
        expect(c.academy).toContain(slug);
      });
    });

    VIDEO_COURSES.forEach((c) => {
      if (c.academy) {
        c.academy.forEach((slug) => {
          expect(ACADEMY_TRACK_SLUGS).toContain(slug);
        });
      }
    });
  });

  test("design tokens define semantic restrained technical palette", () => {
    expect(designTokens.color.bg).toBe("#F8FAFC");
    expect(designTokens.color.text).toBe("#0F172A");
    expect(designTokens.color.primary).toBe("#2563EB");
    expect(designTokens.color.success).toBe("#059669");
    expect(designTokens.color.danger).toBe("#DC2626");
    expect(designTokens.radius.lg).toBe("8px");
  });
});
