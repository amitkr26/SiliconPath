import { callAI } from "./providers";

export async function checkIfExpired(opportunity: any): Promise<boolean> {
  if (opportunity.deadline && new Date(opportunity.deadline) < new Date()) {
    return true;
  }

  if (!opportunity.deadline && opportunity.description) {
    try {
      const prompt = `Does this job posting appear to be closed, expired, or no longer accepting applications?
Text: "${opportunity.description.slice(0, 500)}"
Answer only "yes" or "no".`;

      const response = await callAI(prompt, undefined, {
        preferredProvider: "cloudflare",
        feature: "expiry-checker",
      });
      return response.text.toLowerCase().includes("yes");
    } catch {
      return false;
    }
  }

  return false;
}
