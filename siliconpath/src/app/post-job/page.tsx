import { redirect } from "next/navigation";
import { postEmployerJob } from "@/lib/data/company";
import { getMyProfile } from "@/lib/data/profile";
import { CATEGORIES } from "@/lib/types";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

// Employer posting feeds the SAME unified opportunities listing (source_type=employer_posted).
export default async function PostJobPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  async function post(formData: FormData) {
    "use server";
    await postEmployerJob({
      companyName: String(formData.get("company") || ""),
      title: String(formData.get("title") || ""),
      category: String(formData.get("category") || "private-vlsi"),
      location: String(formData.get("location") || ""),
      deadline: String(formData.get("deadline") || ""),
      eligibility: String(formData.get("eligibility") || ""),
      description: String(formData.get("description") || ""),
      applyLink: String(formData.get("apply_link") || ""),
    });
    redirect("/opportunities");
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontFamily: tokens.font.display }}>Post a job</h1>
      <p style={{ color: tokens.color.textMuted, fontSize: 13 }}>Your posting appears in the same opportunities listing as scraped roles.</p>
      <form action={post} style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <input name="company" placeholder="Company / organization" required style={field} />
        <input name="title" placeholder="Role title" required style={field} />
        <select name="category" style={field} defaultValue="private-vlsi">
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input name="location" placeholder="Location" style={field} />
        <input name="deadline" placeholder="Deadline (e.g. 2026-08-31)" style={field} />
        <input name="eligibility" placeholder="Eligibility" style={field} />
        <textarea name="description" placeholder="Description" required style={{ ...field, minHeight: 120 }} />
        <input name="apply_link" type="url" placeholder="Apply link (https://…)" required style={field} />
        <button type="submit" style={{ ...field, background: tokens.color.accent, color: "#04121A", fontWeight: 600, cursor: "pointer" }}>Publish</button>
      </form>
    </div>
  );
}

const field: React.CSSProperties = { padding: "10px 12px", background: tokens.color.surfaceAlt, border: `1px solid ${tokens.color.border}`, borderRadius: 8, color: tokens.color.text };
