import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/data/profile";
import { tokens } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

// The resume builder is a DIFFERENT SURFACE over the SAME canonical fields as the
// profile — not a separate copy. The PDF is a generated output (print stylesheet
// now; server-rendered PDF can come later) built from these fields on demand.
export default async function ResumePage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: tokens.font.display }}>Resume</h1>
        <a href="/profile" style={{ color: tokens.color.accent, fontSize: 14 }}>Edit fields →</a>
      </div>
      <p style={{ color: tokens.color.textMuted, fontSize: 13 }}>
        Generated from your profile fields. Use your browser's Print → Save as PDF.
      </p>

      <div style={{ background: "#fff", color: "#111", padding: 32, borderRadius: 8, marginTop: 12, fontFamily: tokens.font.body }}>
        <h2 style={{ margin: 0 }}>{profile.full_name || "Your Name"}</h2>
        <div style={{ color: "#444" }}>{[profile.headline, profile.location].filter(Boolean).join(" · ")}</div>
        {profile.about && <p>{profile.about}</p>}

        {profile.skills.length > 0 && (
          <section>
            <h3>Skills</h3>
            <div>{profile.skills.join(" · ")}</div>
          </section>
        )}

        {profile.experience.length > 0 && (
          <section>
            <h3>Experience</h3>
            {profile.experience.map((x, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <strong>{x.title}</strong>{x.org ? `, ${x.org}` : ""}
                <div style={{ color: "#555", fontSize: 13 }}>{[x.start, x.end].filter(Boolean).join(" – ")}</div>
                {x.summary && <div>{x.summary}</div>}
              </div>
            ))}
          </section>
        )}

        {profile.education.length > 0 && (
          <section>
            <h3>Education</h3>
            {profile.education.map((e, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <strong>{e.degree}</strong>{e.field ? `, ${e.field}` : ""}
                <div style={{ color: "#555", fontSize: 13 }}>{[e.institution, [e.start, e.end].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}</div>
              </div>
            ))}
          </section>
        )}

        {profile.publications.length > 0 && (
          <section>
            <h3>Publications</h3>
            {profile.publications.map((p, i) => (
              <div key={i}>{[p.title, p.venue, p.year].filter(Boolean).join(", ")}</div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
