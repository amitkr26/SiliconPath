import { redirect } from "next/navigation";
import Link from "next/link";
import { getMyProfile } from "@/lib/data/profile";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

// Progressive disclosure: signed-in users are proactively pointed at every
// feature. No owner-only gating, no waiting period.
export default async function DashboardPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  const completeness = [
    profile.headline,
    profile.about,
    profile.education.length > 0,
    profile.experience.length > 0,
    profile.skills.length > 0,
  ].filter(Boolean).length;

  const prompts = [
    { done: !!profile.about, label: "Complete your profile", href: "/profile" },
    { done: profile.skills.length > 0, label: "Add your skills", href: "/profile" },
    { done: false, label: "Build your resume", href: "/resume" },
    { done: false, label: "Browse opportunities", href: "/opportunities" },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: tokens.font.display }}>Welcome{profile.full_name ? `, ${profile.full_name}` : ""}</h1>
      <p style={{ color: tokens.color.textMuted }}>Profile {completeness}/5 complete.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 12, marginTop: 16 }}>
        {prompts.map((p) => (
          <Link key={p.label} href={p.href} style={{ padding: 16, background: tokens.color.surface, border: `1px solid ${tokens.color.border}`, borderRadius: 10, textDecoration: "none", color: tokens.color.text }}>
            <div style={{ fontWeight: 600 }}>{p.label}</div>
            <div style={{ color: p.done ? tokens.color.accent : tokens.color.textMuted, fontSize: 13 }}>{p.done ? "Done" : "Start →"}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
