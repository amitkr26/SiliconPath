"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Zap, Loader2, Eye, EyeOff, User, Building2, ShieldCheck, 
  CheckCircle2, XCircle, ArrowRight, Sparkles, UserCheck 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getURL } from "@/lib/utils";
import { toast } from "sonner";

type AccountType = "seeker" | "provider";

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get("role");

  // Determine initial account type from URL
  const initialType: AccountType = 
    initialRoleParam === "employer" || initialRoleParam === "provider" 
      ? "provider" 
      : "seeker";

  const [accountType, setAccountType] = useState<AccountType>(initialType);
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("VLSI ASIC Design");
  const [orgType, setOrgType] = useState("Government Research Lab (DRDO / ISRO / CSIR)");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Update account type if URL changes
  useEffect(() => {
    if (initialRoleParam === "employer" || initialRoleParam === "provider") {
      setAccountType("provider");
    } else if (initialRoleParam === "candidate" || initialRoleParam === "seeker") {
      setAccountType("seeker");
    }
  }, [initialRoleParam]);

  // Debounced username availability check & auto-suggestions
  const checkUsername = useCallback(async (name: string) => {
    const clean = name.trim().toLowerCase().replace(/^@/, "");
    if (!clean || clean.length < 3) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      setSuggestions([]);
      return;
    }

    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(clean)}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      if (data.available) {
        setUsernameStatus("available");
        setUsernameMessage(`@${clean} is available!`);
      } else {
        setUsernameStatus("unavailable");
        setUsernameMessage(data.error || "Username is not available.");
      }
    } catch {
      setUsernameStatus("available");
      setUsernameMessage(`@${clean} is valid.`);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) checkUsername(username);
    }, 400);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUser = username.trim().toLowerCase().replace(/^@/, "");
    if (accountType === "seeker" && usernameStatus === "unavailable") {
      toast.error("Please choose an available username.");
      return;
    }

    setLoading(true);
    try {
      // 1. Primary signup attempt via auto-confirming admin API (bypasses Supabase email rate limiters)
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          username: cleanUser,
          accountType,
          orgName,
          orgType,
          specialization,
        }),
      });

      const apiData = await res.json();

      if (res.ok && apiData.success) {
        // Auto-login user with created credentials
        const supabase = createClient();
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        
        if (!loginErr) {
          toast.success("Account created successfully! Welcome to BerojgarDegreeWala.");
          router.push(accountType === "provider" ? "/employer/post-job" : "/onboarding");
          return;
        }
        
        toast.success("Account created! Please sign in with your credentials.");
        router.push("/login");
        return;
      }

      // If backend error indicates email rate limit or general error, try standard client signup as fallback
      if (apiData.error && (apiData.error.includes("already exists") || apiData.error.includes("registered"))) {
        toast.error(apiData.error);
        return;
      }

      // Fallback: standard client signup
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: cleanUser || email.split("@")[0],
            account_type: accountType,
            org_name: accountType === "provider" ? orgName : null,
            org_type: accountType === "provider" ? orgType : null,
            specialization: accountType === "seeker" ? specialization : null,
          },
          emailRedirectTo: `${getURL()}auth/callback?next=${accountType === "provider" ? "/employer/post-job" : "/onboarding"}`,
        },
      });

      if (error) {
        if (error.message.includes("rate limit") || error.message.includes("exceeded")) {
          toast.error("Registration server busy. Please sign in or try again in a few minutes.");
        } else {
          toast.error(error.message);
        }
      } else {
        setConfirmSent(true);
        toast.success("Registration link sent! Please check your email to activate.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (confirmSent) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white border-4 border-slate-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#0F172A] text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-500 border-3 border-slate-900 rounded-2xl flex items-center justify-center text-slate-900 mx-auto shadow-[4px_4px_0px_0px_#0F172A]">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Check Your Inbox</h1>
          <p className="text-slate-600 text-xs font-extrabold leading-relaxed">
            We sent a verification link to <span className="text-blue-600 underline font-mono">{email}</span>. Click the link to complete your account setup.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] transition"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const isSeeker = accountType === "seeker";

  const handleGoogleSignup = async () => {
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : getURL();
      const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      const nextPath = accountType === "provider" ? "/employer/post-job" : "/onboarding";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${cleanOrigin}/auth/callback?next=${nextPath}` },
      });
      if (error) toast.error(error.message);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to sign up with Google.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-lg w-full space-y-6">
        
        {/* BRAND HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-2 border-slate-900 rounded-full shadow-[3px_3px_0px_0px_#0F172A]">
            <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">BerojgarDegreeWala</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isSeeker ? "Join as Candidate / Researcher" : "Join as Employer & Research Lab"}
          </h1>
          <p className="text-slate-600 text-xs font-extrabold">
            {isSeeker
              ? "Build your hardware profile, access verified DRDO/ISRO openings, & learn VLSI."
              : "Post verified JRF, PhD, & microelectronics roles to recruit top IIT talent."}
          </p>
        </div>

        {/* ROLE SWITCHER TABS */}
        <div className="grid grid-cols-2 gap-3 bg-white p-2 border-3 border-slate-900 rounded-2xl shadow-[5px_5px_0px_0px_#0F172A]">
          <button
            type="button"
            onClick={() => setAccountType("seeker")}
            className={`py-3 px-3 rounded-xl font-black text-xs border-2 transition-all flex items-center justify-center gap-2 ${
              isSeeker
                ? "bg-blue-600 text-white border-slate-900 shadow-[3px_3px_0px_0px_#0F172A]"
                : "bg-transparent text-slate-700 border-transparent hover:bg-slate-100"
            }`}
          >
            <User className="w-4 h-4 stroke-[2.5]" />
            <span>Job Seeker / Researcher</span>
          </button>

          <button
            type="button"
            onClick={() => setAccountType("provider")}
            className={`py-3 px-3 rounded-xl font-black text-xs border-2 transition-all flex items-center justify-center gap-2 ${
              !isSeeker
                ? "bg-emerald-600 text-slate-900 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A]"
                : "bg-transparent text-slate-700 border-transparent hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-4 h-4 stroke-[2.5]" />
            <span>Employer / Research Lab</span>
          </button>
        </div>

        {/* REGISTRATION FORM CARD */}
        <div
          className={`bg-white border-4 border-slate-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#0F172A] relative overflow-hidden transition-all ${
            isSeeker ? "border-t-8 border-t-blue-600" : "border-t-8 border-t-emerald-600"
          }`}
        >
          {/* DIRECT GOOGLE OAUTH SIGNUP BUTTON */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full py-3.5 px-4 bg-white border-3 border-slate-900 rounded-xl font-black text-xs text-slate-900 shadow-[4px_4px_0px_0px_#0F172A] hover:bg-slate-50 transition flex items-center justify-center gap-3 mb-5"
          >
            <svg
              width="20"
              height="20"
              style={{ width: "20px", height: "20px", minWidth: "20px", minHeight: "20px" }}
              className="w-5 h-5 shrink-0 flex-none"
              viewBox="0 0 24 24"
            >
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Sign up with Google (Direct 1-Click)</span>
          </button>

          <div className="relative flex justify-center text-xs mb-6">
            <span className="bg-white px-3 font-extrabold text-slate-400 z-10 uppercase tracking-wider">or sign up with email</span>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-900" />
            </div>
          </div>

          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center gap-2">
              {isSeeker ? (
                <User className="w-5 h-5 text-blue-600 stroke-[2.5]" />
              ) : (
                <Building2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
              )}
              <span className="font-black text-slate-900 text-sm uppercase tracking-wide">
                {isSeeker ? "Candidate Account Details" : "Organization Credentials"}
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black border border-slate-900 ${isSeeker ? "bg-blue-100 text-blue-900" : "bg-emerald-100 text-emerald-900"}`}>
              {isSeeker ? "Seeker Role" : "Employer Role"}
            </span>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* FULL NAME / REPRESENTATIVE NAME */}
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                {isSeeker ? "Full Name" : "Official Representative Name"}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isSeeker ? "e.g. Ananya Sharma" : "e.g. Dr. Rajesh Verma"}
                required
                className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-[3px_3px_0px_0px_#0F172A] focus:outline-none"
              />
            </div>

            {/* ORGANIZATION NAME (IF EMPLOYER) */}
            {!isSeeker && (
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                  Organization / Laboratory Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. DRDO RAC, IIT Bombay Microelectronics, Qualcomm India"
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-[3px_3px_0px_0px_#0F172A] focus:outline-none"
                />
              </div>
            )}

            {/* UNIQUE USERNAME (REQUIREMENT) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                  {isSeeker ? "Unique Hardware Username" : "Organization Handle"}
                </label>
                {usernameStatus === "checking" && (
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" /> Checking...
                  </span>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder={isSeeker ? "ananyasharma_vlsi" : "drdo_rac_careers"}
                  required
                  className="w-full pl-8 pr-10 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-[3px_3px_0px_0px_#0F172A] focus:outline-none"
                />
                {usernameStatus === "available" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                )}
                {usernameStatus === "unavailable" && (
                  <XCircle className="w-4 h-4 text-red-600 absolute right-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                )}
              </div>

              {usernameMessage && (
                <p className={`text-[11px] font-bold mt-1 ${usernameStatus === "available" ? "text-emerald-700" : "text-red-600"}`}>
                  {usernameMessage}
                </p>
              )}

              {suggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Available Handle Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setUsername(sug)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:border-blue-600 text-slate-900 font-extrabold text-[10px] rounded-lg border border-slate-300 transition-all"
                      >
                        @{sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SPECIALIZATION / ORG TYPE */}
            {isSeeker ? (
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                  Primary VLSI / Hardware Interest
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-[3px_3px_0px_0px_#0F172A] focus:outline-none"
                >
                  <option value="VLSI ASIC Design">VLSI &amp; ASIC Design</option>
                  <option value="SystemVerilog Verification">SystemVerilog &amp; UVM Verification</option>
                  <option value="Physical Design & STA">Physical Design, Synthesis &amp; STA</option>
                  <option value="Embedded Systems & Firmware">Embedded Systems &amp; Firmware</option>
                  <option value="RF & Microwave Microelectronics">RF &amp; Microwave Microelectronics</option>
                  <option value="Govt JRF/SRF Research (DRDO/ISRO)">Govt JRF/SRF Research (DRDO / ISRO / CSIR)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                  Organization Sector
                </label>
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-[3px_3px_0px_0px_#0F172A] focus:outline-none"
                >
                  <option value="Government Research Lab (DRDO / ISRO / CSIR)">Government Research Lab (DRDO / ISRO / CSIR)</option>
                  <option value="Academic Institution (IIT / NIT / IISc)">Academic Institution (IIT / NIT / IISc)</option>
                  <option value="Semiconductor Enterprise (Intel / Qualcomm / AMD)">Semiconductor Enterprise (Intel / Qualcomm / AMD)</option>
                  <option value="Deeptech / Hardware Startup">Deeptech / Hardware Startup</option>
                </select>
              </div>
            )}

            {/* EMAIL ADDRESS */}
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                {isSeeker ? "Email Address" : "Official Work Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isSeeker ? "ananya@example.com" : "recruitment@drdo.gov.in"}
                required
                className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-[3px_3px_0px_0px_#0F172A] focus:outline-none"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password (min 6 chars)"
                  minLength={6}
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

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading || (isSeeker && usernameStatus === "unavailable")}
              className={`w-full py-3.5 rounded-xl font-black text-xs border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${
                isSeeker
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-emerald-500 hover:bg-emerald-600 text-slate-900"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSeeker ? (
                <>
                  <span>Create Candidate Account</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              ) : (
                <>
                  <span>Create Employer Account &amp; Post Opportunities</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t-2 border-slate-900 text-center">
            <p className="text-xs font-bold text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-black text-blue-600 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// Rendered server-side (and as hydration fallback) so the page always ships an <h1>.
function SignupFallback() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-2 border-slate-900 rounded-full shadow-[3px_3px_0px_0px_#0F172A]">
            <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">BerojgarDegreeWala</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Join as Candidate / Researcher</h1>
          <p className="text-slate-600 text-xs font-extrabold">Create your BerojgarDegreeWala account</p>
        </div>
        <div className="bg-white border-4 border-slate-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#0F172A] flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    </div>
  );
}
