import { sanitizeAIContent } from "@/lib/ai/reasoning-sanitizer";

describe("AI Reasoning Sanitization Security Tests (Defense-in-Depth)", () => {
  it("strips standard <think>...</think> tags cleanly", () => {
    const raw = "<think>Checking database for VLSI jobs...</think>Here are the top VLSI jobs in India.";
    expect(sanitizeAIContent(raw)).toBe("Here are the top VLSI jobs in India.");
  });

  it("strips multiline <think> reasoning blocks", () => {
    const raw = `<think>
1. User asked about JRF.
2. Search database for C-DAC, ISRO.
3. Formulate answer.
</think>
C-DAC is currently recruiting JRF in VLSI Design.`;
    expect(sanitizeAIContent(raw)).toBe("C-DAC is currently recruiting JRF in VLSI Design.");
  });

  it("strips unclosed <think> blocks (fragmented streaming)", () => {
    const raw = "<think>Analyzing user query in background...";
    expect(sanitizeAIContent(raw)).toBe("");
  });

  it("strips alternative tags: <analysis>, <reasoning>, <chain_of_thought>", () => {
    const raw = "<analysis>Internal step</analysis><reasoning>Deep reasoning</reasoning><chain_of_thought>Step 1</chain_of_thought>Final answer.";
    expect(sanitizeAIContent(raw)).toBe("Final answer.");
  });

  it("strips interleaved reasoning and normal text safely", () => {
    const raw = "Point 1: Valid Info. <think>Hidden note 1</think> Point 2: More valid info. <think>Hidden note 2</think>";
    expect(sanitizeAIContent(raw)).toBe("Point 1: Valid Info.  Point 2: More valid info.");
  });

  it("handles null, undefined, or empty string safely", () => {
    expect(sanitizeAIContent(null)).toBe("");
    expect(sanitizeAIContent(undefined)).toBe("");
    expect(sanitizeAIContent("")).toBe("");
  });
});
