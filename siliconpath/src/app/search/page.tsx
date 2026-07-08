"use client";
import { useState } from "react";
import Link from "next/link";
import { tokens } from "@/lib/design/tokens";

interface Row { id: string; title: string; organization: string; location: string | null; }

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setRows(data.rows ?? []);
      setSearched(true);
      if (data.degraded) setNote("AI was unavailable, so this is a plain keyword search.");
    } catch {
      setNote("Search failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontFamily: tokens.font.display }}>Ask for what you want</h1>
      <p style={{ color: tokens.color.textMuted, fontSize: 14 }}>
        e.g. “remote RTL verification roles” or “fully funded PhD in VLSI at an IIT”
      </p>
      <form onSubmit={run} style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe the opportunity you're after…"
          style={{ flex: 1, padding: "10px 12px", background: tokens.color.surfaceAlt, border: `1px solid ${tokens.color.border}`, borderRadius: 8, color: tokens.color.text }}
        />
        <button type="submit" disabled={busy} style={{ padding: "10px 16px", background: tokens.color.accent, color: "#04121A", fontWeight: 600, border: 0, borderRadius: 8, cursor: "pointer" }}>
          {busy ? "…" : "Search"}
        </button>
      </form>

      {note && <p style={{ color: tokens.color.textMuted, fontSize: 13 }}>{note}</p>}

      {searched && rows.length === 0 && !busy && (
        <p style={{ color: tokens.color.textMuted }}>No matches. Try rephrasing.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
        {rows.map((o) => (
          <li key={o.id}>
            <Link href={`/opportunities/${o.id}`} style={{ display: "block", padding: 14, background: tokens.color.surface, border: `1px solid ${tokens.color.border}`, borderRadius: 10, textDecoration: "none", color: tokens.color.text }}>
              <div style={{ fontWeight: 600 }}>{o.title}</div>
              <div style={{ color: tokens.color.accent, fontSize: 14 }}>{o.organization}</div>
              {o.location && <div style={{ color: tokens.color.textMuted, fontSize: 13 }}>{o.location}</div>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
