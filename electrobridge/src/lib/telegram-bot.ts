import type { Opportunity } from "@/types";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

export async function postToTelegram(opportunity: Opportunity) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.log("Telegram not configured, skipping post");
    return;
  }

  const detailUrl = opportunity.slug
    ? `https://electrobridge.vercel.app/opportunities/${opportunity.slug}`
    : `https://electrobridge.vercel.app/opportunities/${opportunity.id}`;

  const message = `
🔬 *New Opportunity on ElectroBridge*

📌 *${opportunity.title}*
🏛️ ${opportunity.organization}
📍 ${opportunity.location || "Check details"}
💰 ${opportunity.stipend || "Check official notice"}
📅 Deadline: ${opportunity.deadline || "TBD"}
🎓 Eligibility: ${opportunity.eligibility || "Check details"}

${opportunity.tags?.map((t) => "#" + t.replace(/\s+/g, "_")).join(" ")}

🔗 [View Details & Apply](${detailUrl})

_ElectroBridge — Electronics & Semiconductor Opportunities_
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
      console.error("Telegram API error:", errorText);
    }
  } catch (error) {
    console.error("Failed to post to Telegram:", error);
  }
}
