import { ImageResponse } from "next/og";
export const runtime = "edge";

// QA audit P1: production returned HTTP 200 with a 0-byte body. The only
// external resource in this image was the ⚡ emoji (fetched from a twemoji
// CDN at render time on the edge) — removed; the image is now fully
// self-contained so the response always has real PNG bytes.
export async function GET() {
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
          alignItems: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "rgba(14,165,233,0.15)",
            border: "3px solid #0EA5E9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            color: "#0EA5E9",
            fontSize: 44,
            fontWeight: 800,
          }}
        >
          BDW
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, color: "white", textAlign: "center" }}>
          Berojgar<span style={{ color: "#3B82F6" }}>DegreeWala</span>
        </div>
        <div style={{ fontSize: 24, color: "#94A3B8", marginTop: 16, textAlign: "center", maxWidth: 800 }}>
          India&apos;s Hardware &amp; Engineering Career Intelligence Platform
        </div>
        <div style={{ marginTop: 32, display: "flex", gap: 16 }}>
          {["JRF", "PhD", "DRDO", "ISRO", "CSIR", "VLSI"].map((tag) => (
            <div
              key={tag}
              style={{
                background: "rgba(14,165,233,0.15)",
                border: "1px solid #0EA5E9",
                borderRadius: 20,
                padding: "8px 16px",
                color: "#0EA5E9",
                fontSize: 18,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
