import { callAI } from "./providers";

const FAST_KEYWORDS = [
  "semiconductor",
  "chip",
  "vlsi",
  "electronics",
  "transistor",
  "wafer",
  "photonics",
  "embedded",
  "sensor",
  "mems",
  "spintronics",
  "nanotechnology",
  "quantum",
  "laser",
  "optoelectronics",
  "iot",
  "fpga",
  "microcontroller",
  "power electronics",
  "5g",
  "gan",
  "sic",
  "gallium",
  "graphene",
  "drdo",
  "isro",
  "csir",
  "iit",
  "nit",
  "JRF",
  "PhD",
  "fellowship",
];

export async function isArticleRelevant(
  title: string,
  summary: string
): Promise<boolean> {
  const text = (title + " " + summary).toLowerCase();
  const hasKeyword = FAST_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));

  if (hasKeyword) return true;

  try {
    const prompt = `Is this news article relevant to electronics or semiconductor industry professionals?
Title: ${title}
Summary: ${summary}
Answer with only "yes" or "no".`;

    const response = await callAI(prompt, undefined, {
      preferredProvider: "groq",
      feature: "news-filter",
    });
    return response.text.toLowerCase().trim().startsWith("yes");
  } catch {
    return false;
  }
}
