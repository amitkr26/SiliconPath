import { callAIAdvanced } from "./providers";

export async function generateWeeklyDigest(
  opportunities: any[],
  newsArticles: any[]
): Promise<string> {
  const prompt = `You are the editor of ElectroBridge, a platform for electronics and semiconductor researchers in India.

Write a weekly digest email. This week we have:

NEW OPPORTUNITIES (${opportunities.length}):
${opportunities
  .map(
    (o) =>
      `- ${o.title} at ${o.organization} | Deadline: ${o.deadline} | ${o.stipend}`
  )
  .join("\n")}

TOP NEWS (${newsArticles.length} articles, show top 5):
${newsArticles
  .slice(0, 10)
  .map((n) => `- ${n.title} (${n.source})`)
  .join("\n")}

Write a digest with:
1. A brief exciting intro (2 sentences, mention count of new opportunities)
2. "Opportunity Spotlight" — highlight the most interesting opportunity this week with 3 sentences
3. "News Roundup" — 3-4 sentence summary of the most important industry news
4. A motivating closing line for researchers

Keep it professional but warm. Under 300 words total.
Return plain text (not HTML, not JSON).`;

  const response = await callAIAdvanced(prompt);

  return response.text;
}
