const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "notifications@berojgardegreewala.vercel.app";

export async function sendEmailNotification({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  } catch {
    // Email failures are non-critical
  }
}

export function connectionRequestEmail(senderName: string): { subject: string; html: string } {
  return {
    subject: `${senderName} wants to connect on BerojgarDegreeWala`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:32px;border-radius:12px">
      <h2 style="color:#22d3ee;margin:0 0 16px">New Connection Request</h2>
      <p style="color:#94a3b8;line-height:1.6">${senderName} wants to connect with you on BerojgarDegreeWala.</p>
      <a href="https://berojgardegreewala.vercel.app/network" style="display:inline-block;padding:10px 24px;background:#22d3ee;color:#0a0f1e;text-decoration:none;border-radius:8px;font-weight:600;margin-top:12px">View Request</a>
      <p style="color:#475569;font-size:12px;margin-top:24px">BerojgarDegreeWala — Electronics & Semiconductor Opportunities</p>
    </div>`,
  };
}
