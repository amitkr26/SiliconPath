/**
 * Centralized defense-in-depth reasoning content sanitizer.
 * Guarantees that internal model analysis, chain-of-thought, <think> blocks,
 * and fragmented reasoning tags are 100% stripped before reaching the UI.
 */

const COMPLETE_TAGS_REGEX = /<(?:think|analysis|reasoning|chain_of_thought|internal_thought)>[\s\S]*?<\/(?:think|analysis|reasoning|chain_of_thought|internal_thought)>/gi;
const UNCLOSED_TAGS_REGEX = /<(?:think|analysis|reasoning|chain_of_thought|internal_thought)>[\s\S]*$/i;
const ORPHAN_CLOSING_TAGS_REGEX = /<\/(?:think|analysis|reasoning|chain_of_thought|internal_thought)>/gi;

export function sanitizeAIContent(text: string | null | undefined): string {
  if (!text || typeof text !== "string") return "";

  let cleaned = text
    .replace(COMPLETE_TAGS_REGEX, "")
    .replace(ORPHAN_CLOSING_TAGS_REGEX, "")
    .trim();

  // Strip unclosed tags (e.g. if a stream was cut off mid-thought)
  cleaned = cleaned.replace(UNCLOSED_TAGS_REGEX, "").trim();

  // Strip raw system prompt leakage markers if any
  cleaned = cleaned
    .replace(/^\[SYSTEM_INSTRUCTION:[\s\S]*?\]/gi, "")
    .replace(/<\|im_start\|>[\s\S]*?<\|im_end\|>/gi, "")
    .replace(/<\|thought\|>[\s\S]*?<\|thought_end\|>/gi, "")
    .trim();

  return cleaned;
}
