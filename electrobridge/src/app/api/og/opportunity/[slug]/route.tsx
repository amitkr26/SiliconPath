import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase";
export const runtime = "edge";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const { data: opportunity } = await supabaseAdmin
    ?.from("opportunities")
    .select("title, organization, category, location, deadline, eligibility")
    .eq("slug", params.slug)
    .single();

  const title = opportunity?.title || "Opportunity";
  const org = opportunity?.organization || "";
  const category = opportunity?.category || "";
  const location = opportunity?.location || "";
  const deadline = opportunity?.deadline
    ? new Date(opportunity.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #080C14 0%, #0D1321 50%, #0A0F1E 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div
            style={{
              background: "rgba(14,165,233,0.2)",
              borderRadius: 8,
              padding: "8px 16px",
              color: "#0EA5E9",
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {category}
          </div>
          {location && (
            <div style={{ color: "#64748B", fontSize: 18 }}>{location}</div>
          )}
        </div>
        <div style={{ fontSize: 42, fontWeight: 700, color: "white", lineHeight: 1.2, marginBottom: 12 }}>
          {title}
        </div>
        <div style={{ fontSize: 24, color: "#94A3B8", marginBottom: deadline ? 8 : 0 }}>
          {org}
        </div>
        {deadline && (
          <div style={{ fontSize: 18, color: "#F59E0B", marginTop: 8 }}>
            Deadline: {deadline}
          </div>
        )}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 24, color: "#0EA5E9" }}>⚡</span>
          <span style={{ fontSize: 20, color: "white", fontWeight: 600 }}>
            Electro<span style={{ color: "#0EA5E9" }}>Bridge</span>
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
