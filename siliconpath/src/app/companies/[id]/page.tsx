import { notFound } from "next/navigation";
import { getCompany, submitCompanyClaim } from "@/lib/data/company";
import { getCurrentUser } from "@/lib/auth/server";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

export default async function CompanyPage({ params }: { params: { id: string } }) {
  const company = await getCompany(params.id);
  if (!company) notFound();
  const user = await getCurrentUser();

  async function claim(formData: FormData) {
    "use server";
    const workEmail = String(formData.get("work_email") || "");
    await submitCompanyClaim(params.id, workEmail);
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontFamily: tokens.font.display }}>{company.name}</h1>
      {company.type && <div style={{ color: tokens.color.textMuted }}>{company.type}</div>}
      {company.description && <p style={{ color: tokens.color.text }}>{company.description}</p>}

      <section style={{ marginTop: 24, padding: 16, background: tokens.color.surface, border: `1px solid ${tokens.color.border}`, borderRadius: 10 }}>
        <h2 style={{ fontSize: 16, fontFamily: tokens.font.display }}>Claim this page</h2>
        <p style={{ color: tokens.color.textMuted, fontSize: 13 }}>
          A representative can claim this organization using a work email on its domain, then post jobs directly.
        </p>
        {user ? (
          <form action={claim} style={{ display: "flex", gap: 8 }}>
            <input name="work_email" type="email" placeholder="you@company.com" required style={{ flex: 1, padding: "10px 12px", background: tokens.color.surfaceAlt, border: `1px solid ${tokens.color.border}`, borderRadius: 8, color: tokens.color.text }} />
            <button type="submit" style={{ padding: "10px 16px", background: tokens.color.accent, color: "#04121A", fontWeight: 600, border: 0, borderRadius: 8, cursor: "pointer" }}>Claim</button>
          </form>
        ) : (
          <p style={{ color: tokens.color.textMuted, fontSize: 13 }}><a href="/login" style={{ color: tokens.color.accent }}>Log in</a> to claim.</p>
        )}
      </section>
    </div>
  );
}
