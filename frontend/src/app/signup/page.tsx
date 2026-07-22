"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Loader2, Eye, EyeOff, Briefcase, Building2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getURL } from "@/lib/utils";
import { toast } from "sonner";

type AccountType = "seeker" | "provider";

export default function SignupPage() {
  const [step, setStep] = useState<"role" | "form">("role");
  const [accountType, setAccountType] = useState<AccountType>("seeker");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const chooseRole = (type: AccountType) => {
    setAccountType(type);
    setStep("form");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            account_type: accountType,
            org_name: accountType === "provider" ? orgName : null,
          },
          emailRedirectTo: `${getURL()}auth/callback?next=/onboarding`,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        setConfirmSent(true);
        toast.success("Check your email to confirm your account!");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getURL()}auth/callback?next=/onboarding`,
          queryParams: { account_type: accountType },
        },
      });
      if (error) toast.error(error.message);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to sign in with Google.");
    }
  };

  if (confirmSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Check your email</h1>
          <p className="text-text-secondary">
            We sent a confirmation link to <span className="font-medium text-text-primary">{email}</span>.
            Click it to activate your account, then finish setting up your profile.
          </p>
          <Link href="/login" className="inline-block mt-2 px-5 py-2.5 rounded-lg bg-accent text-white font-semibold">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <span className="text-lg font-bold text-text-primary">BerojgarDegreeWala</span>
        </div>

        {step === "role" ? (
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-text-primary">Join BerojgarDegreeWala</h1>
              <p className="text-text-secondary mt-1">How do you want to use the platform?</p>
            </div>

            <button
              onClick={() => chooseRole("seeker")}
              className="w-full text-left rounded-xl border border-border bg-bg-secondary hover:border-accent p-5 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                    I&apos;m looking for opportunities
                  </h3>
                  <p className="text-sm text-text-secondary mt-0.5">
                    Students, researchers, and engineers. Find JRF/PhD/jobs, build your profile, learn VLSI.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => chooseRole("provider")}
              className="w-full text-left rounded-xl border border-border bg-bg-secondary hover:border-accent p-5 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                    I&apos;m hiring or posting opportunities
                  </h3>
                  <p className="text-sm text-text-secondary mt-0.5">
                    Companies, institutions, universities, and labs. Post roles and find talent.
                  </p>
                </div>
              </div>
            </button>

            <p className="text-center text-sm text-text-secondary">
              Already have an account?{" "}
              <Link href="/login" className="text-accent font-medium">Sign in</Link>
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <button
              onClick={() => setStep("role")}
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {accountType === "seeker" ? "Create your account" : "Create your organization account"}
              </h1>
              <p className="text-text-secondary mt-1">
                {accountType === "seeker"
                  ? "Track opportunities, connect, and learn."
                  : "Post opportunities and reach semiconductor talent worldwide."}
              </p>
            </div>

            <button
              onClick={handleGoogle}
              className="w-full py-2.5 rounded-lg border border-border bg-bg-secondary text-text-primary text-sm font-medium hover:border-accent transition-colors"
            >
              Continue with Google
            </button>

            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {accountType === "seeker" ? "Full name" : "Your name"}
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={accountType === "seeker" ? "Ada Lovelace" : "Jane Doe"}
                  required
                  className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-text-muted"
                />
              </div>

              {accountType === "provider" && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Organization name</label>
                  <input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Semiconductors / IIT Delhi"
                    required
                    className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-text-muted"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-text-muted"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    minLength={6}
                    className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 pr-10 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="text-center text-sm text-text-secondary">
              Already have an account?{" "}
              <Link href="/login" className="text-accent font-medium">Sign in</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
