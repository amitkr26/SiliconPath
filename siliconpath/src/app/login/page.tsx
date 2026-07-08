"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/auth/client";
import { tokens } from "@/lib/design/tokens";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    router.push("/dashboard");
    router.refresh();
  }

  async function signInGoogle() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div style={{ maxWidth: 380, margin: "40px auto" }}>
      <h1 style={{ fontFamily: tokens.font.display }}>Log in</h1>
      <form onSubmit={signIn} style={{ display: "grid", gap: 10 }}>
        <input style={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={field} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p style={{ color: "#F87171", fontSize: 13 }}>{error}</p>}
        <button style={primary} disabled={busy} type="submit">{busy ? "…" : "Log in"}</button>
      </form>
      <button style={{ ...field, marginTop: 10, cursor: "pointer" }} onClick={signInGoogle}>Continue with Google</button>
      <p style={{ color: tokens.color.textMuted, fontSize: 13, marginTop: 12 }}>
        No account? <a href="/signup" style={{ color: tokens.color.accent }}>Sign up</a>
      </p>
    </div>
  );
}

const field: React.CSSProperties = { padding: "10px 12px", background: tokens.color.surfaceAlt, border: `1px solid ${tokens.color.border}`, borderRadius: 8, color: tokens.color.text };
const primary: React.CSSProperties = { ...field, background: tokens.color.accent, color: "#04121A", fontWeight: 600, cursor: "pointer" };
