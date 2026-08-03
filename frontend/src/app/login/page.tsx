"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2, Eye, EyeOff, Lock, User, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getURL } from "@/lib/utils";
import { toast } from "sonner";

export default function LoginPage() {
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

      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Logged in successfully!");
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : getURL();
      const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${cleanOrigin}/auth/callback` },
      });
      if (error) toast.error(error.message);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to sign in with Google.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        
        {/* BRAND HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-2 border-slate-900 rounded-full shadow-[3px_3px_0px_0px_#0F172A]">
            <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">BerojgarDegreeWala</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-600 text-xs font-extrabold">Sign in to your candidate or employer account</p>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white border-4 border-slate-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#0F172A] space-y-5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 bg-white border-2 border-slate-900 rounded-xl font-black text-xs text-slate-900 shadow-[3px_3px_0px_0px_#0F172A] hover:bg-slate-50 transition flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4 min-w-[16px] min-h-[16px] shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="relative flex justify-center text-xs my-2">
            <span className="bg-white px-3 font-extrabold text-slate-400 z-10 uppercase tracking-wider">or continue with email or username</span>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-900" />
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                Email Address or Username
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com or @username"
                required
                className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-[3px_3px_0px_0px_#0F172A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-4 pr-10 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-[3px_3px_0px_0px_#0F172A] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t-2 border-slate-900 text-center space-y-2">
            <p className="text-xs font-bold text-slate-600">
              Don&apos;t have an account?
            </p>
            <div className="flex items-center justify-center gap-4 text-xs font-black">
              <Link href="/signup?role=candidate" className="text-blue-600 hover:underline">
                Join as Candidate
              </Link>
              <span className="text-slate-400">•</span>
              <Link href="/signup?role=employer" className="text-emerald-700 hover:underline">
                Join as Employer
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
