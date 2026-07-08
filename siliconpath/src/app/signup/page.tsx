"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/auth/client";
import { tokens } from "@/lib/design/tokens";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createSupabaseBrowser();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setBusy(false);
    if (error) return setError(error.message);
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setNotice("Check your email to confirm your account, then log in.");
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "40px auto" }}>
      <h1 style={{ fontFamily: tokens.font.display }}>Sign up</h1>
      <p style={{ color: tokens.color.textMuted, fontSize: 14 }}>Free, and unlocks everything: profile, resume builder, network, messaging.</p>
      <form onSubmit={signUp} style={{ display: "grid", gap: 10 }}>
        <input style={field} placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <input style={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={field} type="password" placeholder="Password (8+ chars)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        {error && <p style={{ color: "#F87171", fontSize: 13 }}>{error}</p>}
        {notice && <p style={{ color: tokens.color.accent, fontSize: 13 }}>{notice}</p>}
        <button style={primary} disabled={busy} type="submit">{busy ? "…" : "Create account"}</button>
      </form>
      <p style={{ color: tokens.color.textMuted, fontSize: 13, marginTop: 12 }}>
        Already have one? <a href="/login" style={{ color: tokens.color.accent }}>Log in</a>
      </p>
    </div>
  );
}

const field: React.CSSProperties = { padding: "10px 12px", background: tokens.color.surfaceAlt, border: `1px solid ${tokens.color.border}`, borderRadius: 8, color: tokens.color.text };
const primary: React.CSSProperties = { ...field, background: tokens.color.accent, color: "#04121A", fontWeight: 600, cursor: "pointer" };
