import Link from "next/link";

export default function NotFound() {
  return (
    <main className="detail">
      <h1>Not found</h1>
      <p style={{ color: "var(--text-dim)" }}>That page or opportunity doesn't exist (or is no longer active).</p>
      <Link href="/opportunities" className="btn">Browse opportunities</Link>
    </main>
  );
}
