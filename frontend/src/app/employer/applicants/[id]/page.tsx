"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  User, ArrowLeft, Loader2, Mail, MapPin, Briefcase,
  CheckCircle2, Clock, XCircle, FileText, Download,
  MessageSquare, Save, ExternalLink, ShieldCheck, Sparkles
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function EmployerApplicantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicantId = params?.id as string;

  const { user, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [application, setApplication] = useState<any | null>(null);
  const [stage, setStage] = useState("applied");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=/employer/applicants/${applicantId}`);
      return;
    }
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isEmployer, isAdmin, authLoading, router, applicantId]);

  const loadApplication = useCallback(async () => {
    if (!applicantId || !user) return;
    try {
      setLoading(true);
      const res = await api.get<{ application: any }>(`/api/employer/applicants/${applicantId}`);
      if (res.application) {
        setApplication(res.application);
        setStage(res.application.status || "applied");
        setNotes(res.application.notes || "");
      }
    } catch {
      toast.error("Failed to load applicant details");
    } finally {
      setLoading(false);
    }
  }, [applicantId, user]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const handleUpdateStageAndNotes = async () => {
    try {
      setSaving(true);
      await api.patch(`/api/employer/applicants/${applicantId}`, {
        status: stage,
        notes,
      });
      toast.success("Applicant status & notes saved successfully!");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase">Loading Candidate File...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-bg-primary text-center p-4">
        <h2 className="text-lg font-black text-slate-900">Applicant Not Found</h2>
        <Link href="/employer/applicants" className="mt-4 text-xs font-bold text-blue-600 hover:underline">
          ← Return to ATS Pipeline
        </Link>
      </div>
    );
  }

  const candidate = application.user_profile || {};
  const opp = application.opportunity || {};

  return (
    <div className="min-h-screen bg-bg-primary py-8 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/employer/applicants" className="text-xs font-bold text-slate-500 hover:text-blue-600">
              ← Back to ATS Pipeline
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <User className="w-7 h-7 text-blue-600" /> Candidate Application Inspector
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: CANDIDATE DOSSIER */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 sm:p-8 space-y-6">
              {/* CANDIDATE HEADER */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl border-2 border-slate-900 bg-blue-100 text-blue-700 flex items-center justify-center font-black text-2xl shrink-0 shadow-brutal-sm">
                  {candidate.avatar_url ? (
                    <img src={candidate.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    (candidate.display_name?.[0] || "C").toUpperCase()
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">{candidate.display_name || "Applicant"}</h2>
                    {candidate.username && (
                      <span className="text-xs font-bold text-slate-500">@{candidate.username}</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-600">
                    {candidate.headline || "Hardware & Semiconductor Engineer"}
                  </p>
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> {candidate.location || "India"} • {candidate.experience_years ? `${candidate.experience_years} yrs exp` : "Early Career Scholar"}
                  </p>
                </div>
              </div>

              {/* APPLIED ROLE CONTEXT */}
              <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Position Applied For</span>
                <p className="text-sm font-black text-slate-900">{opp.title || "Semiconductor Position"}</p>
                <p className="text-xs text-slate-500">
                  Applied on {new Date(application.applied_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>

              {/* BIO / BACKGROUND */}
              {candidate.bio && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">About Candidate</h3>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">{candidate.bio}</p>
                </div>
              )}

              {/* VERIFIED SKILLS */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Hardware &amp; EDA Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills && candidate.skills.length > 0 ? (
                    candidate.skills.map((sk: string) => (
                      <span key={sk} className="px-3 py-1 rounded-lg bg-blue-50 border-2 border-slate-900 text-xs font-bold text-blue-700 shadow-brutal-sm">
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No specific skills listed.</span>
                  )}
                </div>
              </div>

              {/* EXTERNAL LINKS */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {candidate.username && (
                  <Link
                    href={`/profile/${candidate.username}`}
                    target="_blank"
                    className="px-3 py-1.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-brutal-sm hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Public Portfolio
                  </Link>
                )}
                {candidate.github_url && (
                  <a
                    href={candidate.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-brutal-sm hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    GitHub
                  </a>
                )}
                {candidate.linkedin_url && (
                  <a
                    href={candidate.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-brutal-sm hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT: RECRUITER ACTIONS & NOTES */}
          <div className="space-y-6">
            <Card className="p-6 space-y-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-2">
                Hiring Pipeline Stage
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-600 block">Current Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-black text-slate-900 shadow-brutal-sm focus:outline-none"
                >
                  <option value="applied">1. Applied (New)</option>
                  <option value="screening">2. Screening &amp; Background</option>
                  <option value="shortlisted">3. Shortlisted</option>
                  <option value="interview">4. Technical Interview</option>
                  <option value="accepted">5. Accepted / Hired</option>
                  <option value="rejected">6. Rejected</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-600 block">Private Recruiter Notes</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add interview feedback, GATE verification, or notes..."
                  className="w-full p-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-medium text-slate-900 focus:outline-none resize-none"
                />
              </div>

              <Button
                onClick={handleUpdateStageAndNotes}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Stage &amp; Notes</span>
              </Button>

              <div className="pt-2 border-t-2 border-slate-900 space-y-2">
                <Link
                  href={`/employer/messages`}
                  className="w-full py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-brutal-sm hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" /> Send Message
                </Link>
              </div>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
