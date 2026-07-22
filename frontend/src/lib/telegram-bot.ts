import type { Opportunity } from "@/types";
import { logger } from "@/lib/logger";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

export async function postToTelegram(opportunity: Opportunity) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    logger.warn("Telegram not configured, skipping post");
    return;
  }

  const detailUrl = opportunity.slug
    ? `https://berojgardegreewala.vercel.app/opportunities/${opportunity.slug}`
    : `https://berojgardegreewala.vercel.app/opportunities/${opportunity.id}`;

  const message = `
🔬 *New Opportunity on BerojgarDegreeWala*

📌 *${opportunity.title}*
🏛️ ${opportunity.organization}
📍 ${opportunity.location || "Check details"}
💰 ${opportunity.stipend || "Check official notice"}
📅 Deadline: ${opportunity.deadline || "TBD"}
🎓 Eligibility: ${opportunity.eligibility || "Check details"}

${opportunity.tags?.map((t) => "#" + t.replace(/\s+/g, "_")).join(" ")}

🔗 [View Details & Apply](${detailUrl})

_BerojgarDegreeWala — Electronics & Semiconductor Opportunities_
  `;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          text: message.trim(),
          parse_mode: "Markdown",
          disable_web_page_preview: false,
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      logger.error("Telegram API error", { error: errorText });
    }
  } catch (error) {
    logger.error("Failed to post to Telegram", { error: error instanceof Error ? error.message : String(error) });
  }
}
