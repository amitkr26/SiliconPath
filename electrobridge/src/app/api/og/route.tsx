import { ImageResponse } from "next/og";
export const runtime = "edge";

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
        <div style={{ fontSize: 80, color: "#0EA5E9", marginBottom: 20 }}>⚡</div>
        <div style={{ fontSize: 56, fontWeight: 700, color: "white", textAlign: "center" }}>
          Electro<span style={{ color: "#0EA5E9" }}>Bridge</span>
        </div>
        <div style={{ fontSize: 24, color: "#94A3B8", marginTop: 16, textAlign: "center", maxWidth: 800 }}>
          Electronics & Semiconductor Opportunities
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
    { width: 1200, height: 630 }
  );
}
