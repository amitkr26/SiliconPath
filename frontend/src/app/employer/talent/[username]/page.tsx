"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  User, ArrowLeft, Loader2, Mail, MapPin, Briefcase,
  CheckCircle2, Clock, FileText, Send, ExternalLink,
  MessageSquare, Sparkles, Building2
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

export default function EmployerTalentCandidatePage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string;

  const { user, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [candidate, setCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Invitation / reachout modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=/employer/talent/${username}`);
      return;
    }
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isEmployer, isAdmin, authLoading, router, username]);

  const loadCandidateAndJobs = useCallback(async () => {
    if (!username || !user) return;
    try {
      setLoading(true);
      const [candRes, jobsRes] = await Promise.all([
        api.get<{ candidate: any }>(`/api/employer/talent/${username}`),
        api.get<{ jobs: any[] }>(`/api/employer/jobs`),
      ]);
      setCandidate(candRes.candidate);
      const activeJobs = (jobsRes.jobs || []).filter((j: any) => j.is_active !== false);
      setJobs(activeJobs);
      if (activeJobs.length > 0) setSelectedJob(activeJobs[0].id);
    } catch {
      toast.error("Failed to load candidate profile");
    } finally {
      setLoading(false);
    }
  }, [username, user]);

  useEffect(() => {
    loadCandidateAndJobs();
  }, [loadCandidateAndJobs]);

  const handleSendInvite = async () => {
    if (!selectedJob) {
      toast.error("Please select a position to invite this candidate to.");
      return;
    }

    try {
      setSending(true);
      const res = await fetch("/api/employer/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate.id,
          candidateUsername: candidate.username,
          jobId: selectedJob,
          message: inviteNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation");

      toast.success(`Application invitation sent directly to @${candidate.username}!`);
      setInviteModalOpen(false);
      setInviteNote("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase">Loading Candidate Profile...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-bg-primary text-center p-4">
        <h2 className="text-lg font-black text-slate-900">Candidate Not Found</h2>
        <Link href="/employer/talent" className="mt-4 text-xs font-bold text-blue-600 hover:underline">
          ← Return to Talent Sourcing
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/employer/talent" className="text-xs font-bold text-slate-500 hover:text-blue-600">
              ← Back to Talent Search
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-blue-600" /> Talent Candidate Profile
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: CANDIDATE PROFILE */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl border border-slate-200 flex items-center justify-center font-bold text-2xl shrink-0 shadow-xs overflow-hidden relative">
                  <ImageWithFallback
                    src={candidate.avatar_url}
                    alt={candidate.display_name || "Scholar"}
                    fallbackType="avatar"
                    fallbackName={candidate.display_name || "Scholar"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">{candidate.display_name || "Scholar"}</h2>
                    <span className="text-xs font-bold text-slate-500">@{candidate.username}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-600">
                    {candidate.headline || "VLSI & Hardware Research Scholar"}
                  </p>
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> {candidate.location || "India"} • {candidate.experience_years ? `${candidate.experience_years} yrs exp` : "Early Career"}
                  </p>
                </div>
              </div>

              {candidate.bio && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">About Candidate</h3>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">{candidate.bio}</p>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Specialized Skills &amp; Tools</h3>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills && candidate.skills.length > 0 ? (
                    candidate.skills.map((sk: string) => (
                      <span key={sk} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No specific skills listed.</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={`/profile/${candidate.username}`}
                  target="_blank"
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Public Portfolio
                </Link>
                {candidate.github_url && (
                  <a
                    href={candidate.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5"
                  >
                    GitHub
                  </a>
                )}
                {candidate.linkedin_url && (
                  <a
                    href={candidate.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT: RECRUITER ACTIONS */}
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
                Recruiter Outreach
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Reach out directly to this verified scholar or invite them to apply for your active research positions.
              </p>

              <Button
                onClick={() => setInviteModalOpen(true)}
                className="w-full"
              >
                <Send className="w-4 h-4" />
                <span>Invite to Apply</span>
              </Button>

              <Link
                href={`/employer/messages`}
                className="w-full py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4 text-blue-600" /> Send Message
              </Link>
            </Card>
          </div>

        </div>

        {/* INVITATION MODAL */}
        {inviteModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-elevated space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-black text-slate-900">
                  Invite @{candidate.username} to Apply
                </h3>
                <button
                  onClick={() => setInviteModalOpen(false)}
                  className="text-slate-400 hover:text-slate-900 font-bold"
                >
                  ✕
                </button>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs font-bold text-slate-600">You have no active job postings.</p>
                  <Link
                    href="/employer/post-job"
                    className="inline-block text-xs font-bold text-blue-600 hover:underline"
                  >
                    + Post a position first
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Select Position
                    </label>
                    <select
                      value={selectedJob}
                      onChange={(e) => setSelectedJob(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                    >
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>{j.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Personalized Message Note
                    </label>
                    <textarea
                      rows={3}
                      value={inviteNote}
                      onChange={(e) => setInviteNote(e.target.value)}
                      placeholder="Hi, your RTL / UVM profile stood out. We'd love to review your application for our JRF position..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setInviteModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendInvite} disabled={sending}>
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Send Invitation</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
