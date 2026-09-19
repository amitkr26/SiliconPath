import { deriveStatus } from "../../src/content";

const TODAY = new Date("2026-08-11T12:00:00Z");

describe("status — deadline-based derivation", () => {
  test("deadline in the past → closed", () => {
    expect(
      deriveStatus({ application_deadline: "2026-08-01", today: TODAY })
    ).toBe("closed");
  });

  test("deadline today → closing_soon", () => {
    expect(
      deriveStatus({ application_deadline: "2026-08-11", today: TODAY })
    ).toBe("closing_soon");
  });

  test("deadline within threshold → closing_soon", () => {
    expect(
      deriveStatus({ application_deadline: "2026-08-16", today: TODAY })
    ).toBe("closing_soon");
  });

  test("deadline far in the future → open", () => {
    expect(
      deriveStatus({ application_deadline: "2026-12-31", today: TODAY })
    ).toBe("open");
  });

  test("start date in the future → upcoming even with future deadline", () => {
    expect(
      deriveStatus({
        application_deadline: "2026-12-31",
        application_start: "2026-09-01",
        today: TODAY,
      })
    ).toBe("upcoming");
  });

  test("started but not closed → open", () => {
    expect(
      deriveStatus({
        application_deadline: "2026-12-31",
        application_start: "2026-08-01",
        today: TODAY,
      })
    ).toBe("open");
  });

  test("missing deadline → unknown (never open from fetch)", () => {
    expect(deriveStatus({ application_deadline: null, today: TODAY })).toBe("unknown");
    expect(deriveStatus({ today: TODAY })).toBe("unknown");
  });

  test("archived wins over everything", () => {
    expect(
      deriveStatus({
        application_deadline: "2026-12-31",
        is_archived: true,
        today: TODAY,
      })
    ).toBe("archived");
  });

  test("custom closing threshold", () => {
    expect(
      deriveStatus({ application_deadline: "2026-08-20", today: TODAY, closingThresholdDays: 14 })
    ).toBe("closing_soon");
  });
});