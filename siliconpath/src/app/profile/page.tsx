import { redirect } from "next/navigation";
import { getMyProfile, updateMyProfile } from "@/lib/data/profile";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

// Canonical profile editor. Writes the SAME fields the resume builder reads.
export default async function ProfilePage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  async function save(formData: FormData) {
    "use server";
    const skills = String(formData.get("skills") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await updateMyProfile({
      full_name: String(formData.get("full_name") || ""),
      headline: String(formData.get("headline") || ""),
      location: String(formData.get("location") || ""),
      about: String(formData.get("about") || ""),
      skills,
    });
    redirect("/profile");
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: tokens.font.display }}>Your profile</h1>
      <p style={{ color: tokens.color.textMuted, fontSize: 13 }}>
        These fields power both your profile and your resume — edit once, use everywhere.
      </p>
      <form action={save} style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <label style={lbl}>Full name<input style={field} name="full_name" defaultValue={profile.full_name ?? ""} /></label>
        <label style={lbl}>Headline<input style={field} name="headline" defaultValue={profile.headline ?? ""} placeholder="e.g. RTL Design Engineer" /></label>
        <label style={lbl}>Location<input style={field} name="location" defaultValue={profile.location ?? ""} /></label>
        <label style={lbl}>About<textarea style={{ ...field, minHeight: 100 }} name="about" defaultValue={profile.about ?? ""} /></label>
        <label style={lbl}>Skills (comma-separated)<input style={field} name="skills" defaultValue={profile.skills.join(", ")} placeholder="SystemVerilog, UVM, TCL" /></label>
        <button style={primary} type="submit">Save</button>
      </form>
    </div>
  );
}

const lbl: React.CSSProperties = { display: "grid", gap: 4, color: tokens.color.textMuted, fontSize: 13 };
const field: React.CSSProperties = { padding: "10px 12px", background: tokens.color.surfaceAlt, border: `1px solid ${tokens.color.border}`, borderRadius: 8, color: tokens.color.text };
const primary: React.CSSProperties = { ...field, background: tokens.color.accent, color: "#04121A", fontWeight: 600, cursor: "pointer" };
