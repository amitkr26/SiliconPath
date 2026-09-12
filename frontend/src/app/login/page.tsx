"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getURL } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getSafeRedirectUrl } from "@/lib/permissions";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const input = email.trim();
      let loginEmail = input;

      // If input is not an email (does not contain '@'), resolve email from username in user_profiles
      if (!input.includes("@")) {
        const cleanUser = input.toLowerCase().replace(/^@/, "");
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("email")
          .eq("username", cleanUser)
          .maybeSingle();

        if (profile?.email) {
          loginEmail = profile.email;
        } else {
          toast.error("No account found matching this username.");
          setLoading(false);
          return;
        }
      }

      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Logged in successfully!");
        const role = signInData.user?.user_metadata?.role || signInData.user?.user_metadata?.account_type;
        const defaultTarget = (role === "employer" || role === "provider") ? "/employer/dashboard" : "/dashboard";

        let target = getSafeRedirectUrl(redirectTo, defaultTarget);
        if (redirectTo === "/dashboard" || !redirectTo || redirectTo === "/") {
          target = defaultTarget;
        }
        router.push(target);
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github" | "linkedin") => {
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : getURL();
      const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${cleanOrigin}/auth/callback` },
      });
      if (error) toast.error(error.message);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to sign in with ${provider}.`);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-slate-900 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">

        {/* BRAND HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-2 border-slate-900 rounded-full shadow-brutal-sm">
            <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">BerojgarDegreeWala</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-600 text-sm font-medium">Sign in to your candidate or employer account</p>
        </div>

        {/* LOGIN CARD */}
        <Card className="p-8 space-y-5">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => handleOAuthLogin("google")}
              className="w-full"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </Button>
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => handleOAuthLogin("github")}
              className="w-full"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </Button>
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => handleOAuthLogin("linkedin")}
              className="w-full"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2" className="shrink-0">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </Button>
          </div>

          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 font-medium text-slate-500 z-10 uppercase tracking-wider">or continue with email or username</span>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-900" />
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input
              label="Email Address or Username"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com or @username"
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 bottom-3.5 text-slate-600 hover:text-slate-900"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>

            <div className="text-center">
              <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:underline">
                Forgot your password?
              </Link>
            </div>
          </form>

          <div className="pt-4 border-t-2 border-slate-900 text-center space-y-2">
            <p className="text-xs font-medium text-slate-600">
              Don&apos;t have an account?
            </p>
            <div className="flex items-center justify-center gap-4 text-xs font-bold">
              <Link href="/signup?role=candidate" className="text-blue-600 hover:underline">
                Join as Candidate
              </Link>
              <span className="text-slate-400">•</span>
              <Link href="/signup?role=employer" className="text-blue-600 hover:underline">
                Join as Employer
              </Link>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}

// Rendered server-side (and as hydration fallback) so the page always ships an <h1>.
function LoginFallback() {
  return (
    <div className="min-h-screen bg-bg-primary text-slate-900 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-2 border-slate-900 rounded-full shadow-brutal-sm">
            <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">BerojgarDegreeWala</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-600 text-sm font-medium">Sign in to your candidate or employer account</p>
        </div>
        <Card className="p-8 flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </Card>
      </div>
    </div>
  );
}