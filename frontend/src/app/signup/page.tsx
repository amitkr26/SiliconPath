"use client";

import React, { useState, useEffect, useCallback } from "react";
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

  // Update account type if URL changes
  useEffect(() => {
    if (initialRoleParam === "employer" || initialRoleParam === "provider") {
      setAccountType("provider");
    } else if (initialRoleParam === "candidate" || initialRoleParam === "seeker") {
      setAccountType("seeker");
    }
  }, [initialRoleParam]);

  // Debounced username availability check
  const checkUsername = useCallback(async (name: string) => {
    const clean = name.trim().toLowerCase().replace(/^@/, "");
    if (!clean || clean.length < 3) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(clean)}`);
      const data = await res.json();
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
        toast.error(error.message);
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
