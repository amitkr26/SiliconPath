import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { tokens } from "@/lib/design/tokens";

export const metadata: Metadata = {
  title: "SiliconPath — Semiconductor & VLSI Careers, PhDs, Fellowships",
  description:
    "No-login aggregator for electronics, semiconductor, and VLSI jobs, PhD positions, fellowships, and scholarships from official company and university sources, plus curated industry news.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://siliconpath.vercel.app"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: tokens.color.bg,
          color: tokens.color.text,
          fontFamily: tokens.font.body,
          minHeight: "100vh",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: `1px solid ${tokens.color.border}`,
            position: "sticky",
            top: 0,
            background: tokens.color.bgAlt,
            zIndex: 10,
          }}
        >
          <Brand />
          <nav style={{ display: "flex", gap: 20 }}>
            <Link href="/opportunities" style={{ color: tokens.color.textMuted, textDecoration: "none" }}>
              Opportunities
            </Link>
            <Link href="/news" style={{ color: tokens.color.textMuted, textDecoration: "none" }}>
              News
            </Link>
          </nav>
        </header>
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 64px" }}>{children}</main>
        <footer
          style={{
            borderTop: `1px solid ${tokens.color.border}`,
            padding: "24px",
            color: tokens.color.textMuted,
            fontSize: 13,
            textAlign: "center",
          }}
        >
          SiliconPath · Free, no-login access to semiconductor & VLSI opportunities.
        </footer>
      </body>
    </html>
  );
}
