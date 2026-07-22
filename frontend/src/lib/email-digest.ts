import { supabaseAdmin, isAdminConfigured } from "./supabase";
import type { Opportunity, Subscriber } from "@/types";
import { generateWeeklyDigest } from "@/lib/ai/newsletter";
import { logger } from "@/lib/logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "digest@berojgardegreewala.vercel.app";

interface DigestData {
  newThisWeek: Opportunity[];
  mostPopular: Opportunity[];
}

async function getDigestData(): Promise<DigestData> {
  if (!isAdminConfigured) {
    return { newThisWeek: [], mostPopular: [] };
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date().toISOString().split("T")[0];

  const [{ data: newThisWeek }, { data: mostPopular }] = await Promise.all([
    supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .or(`deadline.gte.${today},deadline.is.null`)
      .gte("created_at", weekAgo)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .or(`deadline.gte.${today},deadline.is.null`)
      .order("apply_clicks", { ascending: false })
      .limit(5),
  ]);

  return {
    newThisWeek: (newThisWeek as Opportunity[]) || [],
    mostPopular: (mostPopular as Opportunity[]) || [],
  };
}

async function getActiveSubscribers(): Promise<Subscriber[]> {
  if (!isAdminConfigured) return [];
  const { data } = await supabaseAdmin
    .from("subscribers")
    .select("*")
    .eq("is_active", true);
  return (data as Subscriber[]) || [];
}

function buildDigestHTML(data: DigestData): string {
  const formatOppRow = (opp: Opportunity, index: number) => {
    const detailUrl = opp.slug
      ? `https://berojgardegreewala.vercel.app/opportunities/${opp.slug}`
      : `https://berojgardegreewala.vercel.app/opportunities/${opp.id}`;

    return `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #1E293B;">
        <div style="display: flex; align-items: flex-start; gap: 8px;">
          <span style="color: #64748B; font-size: 12px; min-width: 20px;">${index + 1}.</span>
          <div>
            <h3 style="margin: 0 0 4px 0; font-size: 14px; color: #F1F5F9; font-weight: 600;">
              ${opp.title}
            </h3>
            <p style="margin: 0; font-size: 12px; color: #94A3B8;">
              ${opp.organization}${opp.deadline ? ` | Deadline: ${new Date(opp.deadline).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}` : ""}${opp.eligibility ? ` | ${opp.eligibility}` : ""}
            </p>
            <a href="${detailUrl}" style="display: inline-block; margin-top: 8px; padding: 6px 16px; background: #06B6D4; color: #0A0F1E; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 600;">
              View & Apply
            </a>
          </div>
        </div>
      </td>
    </tr>`;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0A0F1E; font-family: 'Inter', -apple-system, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 40px 24px 0;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #F1F5F9; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.02em;">
            ⚡ BerojgarDegreeWala Weekly Digest
          </h1>
          <p style="color: #64748B; font-size: 14px; margin: 8px 0 0;">
            Your weekly roundup of electronics &amp; semiconductor opportunities
          </p>
        </div>

        <div style="background: #0F172A; border: 1px solid #1E293B; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #06B6D4; font-size: 16px; font-weight: 600; margin: 0 0 16px; display: flex; align-items: center; gap: 8px;">
            🆕 New This Week
          </h2>
          ${data.newThisWeek.length > 0
            ? `<table width="100%" cellpadding="0" cellspacing="0">${data.newThisWeek.slice(0, 10).map((opp, i) => formatOppRow(opp, i)).join("")}</table>`
            : '<p style="color: #64748B; font-size: 13px; margin: 0;">No new opportunities this week.</p>'
          }
        </div>

        <div style="background: #0F172A; border: 1px solid #1E293B; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #F59E0B; font-size: 16px; font-weight: 600; margin: 0 0 16px;">
            🔥 Most Popular
          </h2>
          ${data.mostPopular.length > 0
            ? `<table width="100%" cellpadding="0" cellspacing="0">${data.mostPopular.map((opp, i) => formatOppRow(opp, i)).join("")}</table>`
            : '<p style="color: #64748B; font-size: 13px; margin: 0;">No popular opportunities data yet.</p>'
          }
        </div>

        <div style="text-align: center; padding: 24px 0;">
          <p style="color: #475569; font-size: 12px; margin: 0;">
            <a href="https://berojgardegreewala.vercel.app" style="color: #06B6D4; text-decoration: none;">BerojgarDegreeWala</a>
            &mdash; Electronics &amp; Semiconductor Opportunities
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendDigest() {
  if (!RESEND_API_KEY) {
    logger.warn("Resend not configured, skipping digest");
    return { sent: 0, error: "RESEND_API_KEY not set" };
  }

  const data = await getDigestData();
  const subscribers = await getActiveSubscribers();

  if (subscribers.length === 0) {
    return { sent: 0, error: "No active subscribers" };
  }

  let html = buildDigestHTML(data);
  let subject = `⚡ BerojgarDegreeWala Weekly Digest — ${new Date().toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}`;

  try {
    const aiDigest = await generateWeeklyDigest(data.newThisWeek, []);
    if (aiDigest) {
      const aiSection = `
        <div style="background: #0F172A; border: 1px solid #1E293B; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #8B5CF6; font-size: 16px; font-weight: 600; margin: 0 0 16px;">
            🤖 AI Editor&apos;s Note
          </h2>
          <p style="color: #94A3B8; font-size: 13px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${aiDigest.replace(/\n/g, "<br>")}</p>
        </div>`;
      html = html.replace(
        '<div style="text-align: center; padding: 24px 0;">',
        `${aiSection}<div style="text-align: center; padding: 24px 0;">`
      );
    }
  } catch {
    // Fall back to non-AI digest if AI fails
  }

  const { Resend } = await import("resend");
  const resend = new Resend(RESEND_API_KEY);

  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: subscriber.email,
        subject,
        html,
      });
      sent++;
    } catch (error) {
      logger.error("Failed to send digest", { email: subscriber.email, error: error instanceof Error ? error.message : String(error) });
      failed++;
    }

    if (subscribers.length > 1) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return { sent, failed, total: subscribers.length };
}
