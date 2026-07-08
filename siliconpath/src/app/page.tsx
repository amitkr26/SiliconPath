import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <h1>{BRAND.name}</h1>
        <p>{BRAND.tagline}</p>
        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          <Link href="/opportunities" className="btn">Browse opportunities</Link>
          <Link href="/news" className="btn" style={{ background: "transparent", color: "var(--accent)", border: "1px solid var(--border)" }}>
            Latest news
          </Link>
        </div>
      </section>
      <section style={{ padding: "16px 0 40px", color: "var(--text-dim)" }}>
        <p>
          One place for JRF/SRF fellowships, funded PhDs, PSU scientist roles (DRDO, ISRO, CSIR), and private
          VLSI jobs — sourced directly from official career pages, with direct apply links. No account needed to browse.
        </p>
      </section>
    </main>
  );
}
