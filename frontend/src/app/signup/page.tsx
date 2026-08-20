"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Zap, Loader2, Eye, EyeOff, User, Building2,
  CheckCircle2, XCircle, ArrowRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getURL } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";

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
      <div className="min-h-screen bg-bg-primary flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-500 border-2 border-slate-900 rounded-2xl flex items-center justify-center text-slate-900 mx-auto shadow-brutal">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Check Your Inbox</h1>
          <p className="text-slate-600 text-sm font-medium leading-relaxed">
            We sent a verification link to <span className="text-blue-600 underline font-mono">{email}</span>. Click the link to complete your account setup.
          </p>
          <Button href="/login" className="w-full">
            Go to Sign In
          </Button>
        </Card>
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
    <div className="min-h-screen bg-bg-primary text-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-lg w-full space-y-6">

        {/* BRAND HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-2 border-slate-900 rounded-full shadow-brutal-sm">
            <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">BerojgarDegreeWala</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isSeeker ? "Join as Candidate / Researcher" : "Join as Employer & Research Lab"}
          </h1>
          <p className="text-slate-600 text-sm font-medium">
            {isSeeker
              ? "Build your hardware profile, access verified DRDO/ISRO openings, & learn VLSI."
              : "Post verified JRF, PhD, & microelectronics roles to recruit top IIT talent."}
          </p>
        </div>

        {/* ROLE SWITCHER TABS */}
        <Card className="p-2 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={isSeeker ? "primary" : "ghost"}
            onClick={() => setAccountType("seeker")}
            className="w-full py-3"
          >
            <User className="w-4 h-4 stroke-[2.5]" />
            <span>Job Seeker / Researcher</span>
          </Button>

          <Button
            type="button"
            variant={!isSeeker ? "primary" : "ghost"}
            onClick={() => setAccountType("provider")}
            className="w-full py-3"
          >
            <Building2 className="w-4 h-4 stroke-[2.5]" />
            <span>Employer / Research Lab</span>
          </Button>
        </Card>

        {/* REGISTRATION FORM CARD */}
        <Card className="p-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-blue-600" />

          {/* DIRECT GOOGLE OAUTH SIGNUP BUTTON */}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleGoogleSignup}
            className="w-full mb-5"
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
            Sign up with Google
          </Button>

          <div className="relative flex justify-center text-xs mb-6">
            <span className="bg-white px-3 font-medium text-slate-500 z-10 uppercase tracking-wider">or sign up with email</span>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-900" />
            </div>
          </div>

          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center gap-2">
              {isSeeker ? (
                <User className="w-5 h-5 text-blue-600 stroke-[2.5]" />
              ) : (
                <Building2 className="w-5 h-5 text-blue-600 stroke-[2.5]" />
              )}
              <span className="font-black text-slate-900 text-sm uppercase tracking-wide">
                {isSeeker ? "Candidate Account Details" : "Organization Credentials"}
              </span>
            </div>
            <Badge tone="accent" className="shrink-0">
              {isSeeker ? "Seeker Role" : "Employer Role"}
            </Badge>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* FULL NAME / REPRESENTATIVE NAME */}
            <Input
              label={isSeeker ? "Full Name" : "Official Representative Name"}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isSeeker ? "e.g. Ananya Sharma" : "e.g. Dr. Rajesh Verma"}
              required
            />

            {/* ORGANIZATION NAME (IF EMPLOYER) */}
            {!isSeeker && (
              <Input
                label="Organization / Laboratory Name"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. DRDO RAC, IIT Bombay Microelectronics, Qualcomm India"
                required
              />
            )}

            {/* UNIQUE USERNAME (REQUIREMENT) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                  {isSeeker ? "Unique Hardware Username" : "Organization Handle"}
                </label>
                {usernameStatus === "checking" && (
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" /> Checking...
                  </span>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 bottom-3 font-black text-slate-400 text-sm">@</span>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder={isSeeker ? "ananyasharma_vlsi" : "drdo_rac_careers"}
                  required
                  className="pl-8 pr-10"
                />
                {usernameStatus === "available" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 bottom-3.5 stroke-[2.5]" />
                )}
                {usernameStatus === "unavailable" && (
                  <XCircle className="w-4 h-4 text-red-600 absolute right-3 bottom-3.5 stroke-[2.5]" />
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
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 border-2 border-slate-900 text-slate-900 font-bold text-[10px] rounded-lg shadow-brutal-sm transition-all"
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
              <Select
                label="Primary VLSI / Hardware Interest"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              >
                <option value="VLSI ASIC Design">VLSI &amp; ASIC Design</option>
                <option value="SystemVerilog Verification">SystemVerilog &amp; UVM Verification</option>
                <option value="Physical Design & STA">Physical Design, Synthesis &amp; STA</option>
                <option value="Embedded Systems & Firmware">Embedded Systems &amp; Firmware</option>
                <option value="RF & Microwave Microelectronics">RF &amp; Microwave Microelectronics</option>
                <option value="Govt JRF/SRF Research (DRDO/ISRO)">Govt JRF/SRF Research (DRDO / ISRO / CSIR)</option>
              </Select>
            ) : (
              <Select
                label="Organization Sector"
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
              >
                <option value="Government Research Lab (DRDO / ISRO / CSIR)">Government Research Lab (DRDO / ISRO / CSIR)</option>
                <option value="Academic Institution (IIT / NIT / IISc)">Academic Institution (IIT / NIT / IISc)</option>
                <option value="Semiconductor Enterprise (Intel / Qualcomm / AMD)">Semiconductor Enterprise (Intel / Qualcomm / AMD)</option>
                <option value="Deeptech / Hardware Startup">Deeptech / Hardware Startup</option>
              </Select>
            )}

            {/* EMAIL ADDRESS */}
            <Input
              label={isSeeker ? "Email Address" : "Official Work Email"}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isSeeker ? "ananya@example.com" : "recruitment@drdo.gov.in"}
              required
            />

            {/* PASSWORD */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password (min 6 chars)"
                minLength={6}
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

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              disabled={loading || (isSeeker && usernameStatus === "unavailable")}
              className="w-full py-3.5"
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
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t-2 border-slate-900 text-center">
            <p className="text-xs font-medium text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-blue-600 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
}

// Rendered server-side (and as hydration fallback) so the page always ships an <h1>.
function SignupFallback() {
  return (
    <div className="min-h-screen bg-bg-primary text-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-2 border-slate-900 rounded-full shadow-brutal-sm">
            <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">BerojgarDegreeWala</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Join as Candidate / Researcher</h1>
          <p className="text-slate-600 text-sm font-medium">Create your BerojgarDegreeWala account</p>
        </div>
        <Card className="p-8 flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </Card>
      </div>
    </div>
  );
}