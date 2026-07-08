import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${BRAND.name} — Semiconductor & VLSI Careers`, template: `%s — ${BRAND.name}` },
  description: BRAND.tagline,
  metadataBase: new URL(BRAND.url),
  openGraph: { title: BRAND.name, description: BRAND.tagline, url: BRAND.url, siteName: BRAND.name },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <nav className="nav">
            <Link href="/" className="brand">
              Silicon<span>Path</span>
            </Link>
            <div style={{ display: "flex", gap: 20 }}>
              <Link href="/opportunities">Opportunities</Link>
              <Link href="/news">News</Link>
            </div>
          </nav>
          {children}
          <footer className="footer">
            <div>{BRAND.name} — free, no-login aggregator. Built for the Indian semiconductor & VLSI community.</div>
          </footer>
        </div>
      </body>
    </html>
  );
}
