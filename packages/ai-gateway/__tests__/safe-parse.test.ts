import { safeParseJSON, parseWithRetry } from "../src/index";

describe("safeParseJSON", () => {
  it("parses valid JSON", () => {
    expect(safeParseJSON('{"key": "value"}', null)).toEqual({ key: "value" });
  });

  it("returns fallback for empty input", () => {
    expect(safeParseJSON("", null)).toBeNull();
  });

  it("extracts JSON from markdown code fences", () => {
    const input = '```json\n{"key": "value"}\n```';
    expect(safeParseJSON(input, null)).toEqual({ key: "value" });
  });

  it("extracts JSON from text with leading prose", () => {
    const input = 'Here is the result:\n{"key": "value"}';
    expect(safeParseJSON(input, null)).toEqual({ key: "value" });
  });

  it("returns fallback for unparseable input", () => {
    expect(safeParseJSON("not json at all", "fallback")).toBe("fallback");
  });
});

describe("parseWithRetry", () => {
  it("returns parsed result on first try", async () => {
    const result = await parseWithRetry('{"key": "value"}', async () => "", null);
    expect(result).toEqual({ key: "value" });
  });

  it("retries on failure", async () => {
    const retryFn = jest
      .fn()
      .mockResolvedValueOnce("not json")
      .mockResolvedValue('{"key": "value"}');
    const result = await parseWithRetry("bad json", retryFn, null, 2);
    expect(result).toEqual({ key: "value" });
    expect(retryFn).toHaveBeenCalledTimes(2);
  });

  it("returns fallback after exhausting retries", async () => {
    const retryFn = jest.fn().mockResolvedValue("still bad");
    const result = await parseWithRetry("bad json", retryFn, "fallback", 1);
    expect(result).toBe("fallback");
  });
});
