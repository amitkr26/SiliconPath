import {
  extractDates,
  normalizeDate,
  containsGuessableDeadline,
  EMPTY_LABELED_DATES,
} from "../../src/content";

describe("dates — normalization", () => {
  test("ISO date", () => {
    expect(normalizeDate("2026-08-30")).toBe("2026-08-30");
  });
  test("DD/MM/YYYY", () => {
    expect(normalizeDate("30/08/2026")).toBe("2026-08-30");
  });
  test("DD.MM.YYYY", () => {
    expect(normalizeDate("30.08.2026")).toBe("2026-08-30");
  });
  test("DD-MM-YYYY", () => {
    expect(normalizeDate("30-08-2026")).toBe("2026-08-30");
  });
  test("25 Sep 2026", () => {
    expect(normalizeDate("25 Sep 2026")).toBe("2026-09-25");
  });
  test("25th September 2026", () => {
    expect(normalizeDate("25th September 2026")).toBe("2026-09-25");
  });
  test("September 25, 2026", () => {
    expect(normalizeDate("September 25, 2026")).toBe("2026-09-25");
  });
});

describe("dates — missing / ambiguous", () => {
  test("null input → null", () => {
    expect(normalizeDate(null)).toBeNull();
  });
  test("empty string → null", () => {
    expect(normalizeDate("")).toBeNull();
  });
  test("garbage → null", () => {
    expect(normalizeDate("Applications close in August.")).toBeNull();
  });
  test("month-only phrase → null (Phase 15 guard)", () => {
    expect(normalizeDate("by the end of August")).toBeNull();
  });
  test("invalid calendar date → null", () => {
    expect(normalizeDate("31-02-2026")).toBeNull();
  });
});

describe("dates — labeled extraction", () => {
  test("deadline labeled correctly", () => {
    const d = extractDates(
      "Applications are invited. Last date for receipt of applications: 30 August 2026. Other details on the portal."
    );
    expect(d.application_deadline).toBe("2026-08-30");
    expect(d.raw.application_deadline).toContain("30 August 2026");
  });

  test("interview date is NOT captured as deadline", () => {
    const d = extractDates(
      "Walk-in interview date: 15 September 2026. Candidates may apply anytime before the interview."
    );
    expect(d.application_deadline).toBeNull();
    expect(d.interview_date).toBe("2026-09-15");
  });

  test("exam date vs application deadline separated", () => {
    const d = extractDates(
      "Application deadline: 10 August 2026. Exam date: 05 September 2026. Joining date: 01 November 2026."
    );
    expect(d.application_deadline).toBe("2026-08-10");
    expect(d.exam_date).toBe("2026-09-05");
    expect(d.joining_date).toBe("2026-11-01");
  });

  test("bare date without label is NOT assigned", () => {
    const d = extractDates("The notification was published on 12 July 2026 for JRF positions.");
    expect(d.application_deadline).toBeNull();
    expect(d.application_start).toBeNull();
  });

  test("posted date labeled", () => {
    const d = extractDates("Notification dated 12 July 2026. Applications open: 15 July 2026.");
    expect(d.posted_date).toBe("2026-07-12");
    expect(d.application_start).toBe("2026-07-15");
  });

  test("empty input → empty labeled dates", () => {
    expect(extractDates(null)).toEqual(EMPTY_LABELED_DATES);
  });
});

describe("dates — conflicting dates from same source type", () => {
  test("first labeled deadline wins, later one kept raw", () => {
    const d = extractDates(
      "Last date: 10 August 2026. Note: the last date has been extended to 25 August 2026."
    );
    // conservative: first explicit label wins — extension handling is manual/verified
    expect(d.application_deadline).toBe("2026-08-10");
  });
});

describe("dates — guessable deadline guard", () => {
  test("detects vague 'closes in August' phrasing", () => {
    expect(containsGuessableDeadline("Applications close in August.")).toBe(true);
  });
  test("precise deadline not flagged", () => {
    expect(containsGuessableDeadline("Last date: 30 August 2026.")).toBe(false);
  });
});