"use client";

import Link from "next/link";
import {
  Building2, Briefcase, Users, PlusCircle, UserCheck,
  LayoutDashboard, ArrowRight, MessageSquare, Sparkles,
  BarChart3, Settings, ShieldCheck, CheckCircle2, AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface EmployerHomeProps {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    display_name?: string;
    username?: string;
    headline?: string;
    current_company?: string;
    job_title?: string;
    location?: string;
  } | null;
  stats: {
    activeJobs: number;
    totalApplicants: number;
    screeningCount: number;
    interviewCount: number;
  };
  recentJobs: any[];
}

export default function EmployerHome({
  user,
  profile,
  stats,
  recentJobs,
}: EmployerHomeProps) {
  const companyName = profile?.current_company || profile?.display_name || "Recruiter";
  const recruiterName = profile?.display_name || user.email?.split("@")[0] || "Employer";

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      
      {/* 1. EMPLOYER COCKPIT HERO */}
      <section className="bg-white border-b border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-3 shadow-xs">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Employer &amp; Lab Management Cockpit
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Welcome back, <span className="text-blue-600">{companyName}</span>
              </h1>
              <p className="text-slate-600 text-sm sm:text-base font-medium mt-1">
                Recruiter: <strong>{recruiterName}</strong> {profile?.job_title ? `(${profile.job_title})` : ""} • Manage hiring campaigns and candidate pipelines.
              </p>
            </div>

            {/* QUICK ACTIONS */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/employer/jobs/new"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 py-2.5 shadow-sm hover:shadow transition-all text-xs"
              >
                <PlusCircle className="w-4 h-4" /> Post New Job
              </Link>
              
              <Link
                href="/employer/talent"
                className="inline-flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-semibold rounded-xl px-5 py-2.5 shadow-xs hover:shadow-sm transition-all text-xs"
              >
                <Users className="w-4 h-4 text-blue-600" /> Sourcing Talent
              </Link>
            </div>

          </div>

          {/* RECRUITMENT STATS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-200">
            <Link href="/employer/jobs" className="p-4 bg-white border border-slate-200 rounded-xl shadow-card hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Active Job Openings</span>
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.activeJobs}</p>
            </Link>

            <Link href="/employer/applicants" className="p-4 bg-white border border-slate-200 rounded-xl shadow-card hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Total Applicants</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalApplicants}</p>
            </Link>

            <Link href="/employer/applicants" className="p-4 bg-white border border-slate-200 rounded-xl shadow-card hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">In Screening</span>
                <UserCheck className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.screeningCount}</p>
            </Link>

            <Link href="/employer/applicants" className="p-4 bg-white border border-slate-200 rounded-xl shadow-card hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Interviews Scheduled</span>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.interviewCount}</p>
            </Link>
          </div>

        </div>
      </section>

      {/* 2. RECRUITMENT PIPELINE & STUDIO ACTIONS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT 2 COLS: RECENT JOBS & ATS SUMMARY */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* RECENT POSTINGS */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">Your Active Job Postings</h2>
                <p className="text-xs text-slate-500 font-medium">Recent semiconductor &amp; research openings posted by your organization.</p>
              </div>
              <Link href="/employer/jobs" className="text-xs font-semibold text-blue-600 hover:underline">
                Manage All ({stats.activeJobs}) →
              </Link>
            </div>

            {recentJobs.length === 0 ? (
              <div className="text-center py-10">
                <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">No active job postings yet</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">Post your first JRF, VLSI internship, or engineering role to start receiving candidate applications.</p>
                <Link
                  href="/employer/jobs/new"
                  className="inline-flex items-center gap-1.5 bg-blue-600 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs hover:bg-blue-700"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Post First Job
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.slice(0, 4).map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-white shadow-xs transition-all">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{job.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{job.category || "Full-time"}</span>
                        <span>•</span>
                        <span>{job.location || "India"}</span>
                        {job.deadline && (
                          <>
                            <span>•</span>
                            <span>Deadline: {new Date(job.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/employer/applicants?jobId=${job.id}`}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
                      >
                        Applicants
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* RECRUITMENT WORKFLOW LINKS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/employer/applicants"
              className="p-5 bg-white border border-slate-200 rounded-2xl shadow-card hover:border-blue-300 hover:shadow-elevated transition-all"
            >
              <Users className="w-5 h-5 text-blue-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-900">ATS Candidate Pipeline</h3>
              <p className="text-xs text-slate-500 mt-1">Review applicant dossiers and advance stages.</p>
            </Link>

            <Link
              href="/employer/messages"
              className="p-5 bg-white border border-slate-200 rounded-2xl shadow-card hover:border-blue-300 hover:shadow-elevated transition-all"
            >
              <MessageSquare className="w-5 h-5 text-emerald-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-900">Candidate Outreach</h3>
              <p className="text-xs text-slate-500 mt-1">Direct messaging and interview coordination.</p>
            </Link>

            <Link
              href="/employer/analytics"
              className="p-5 bg-white border border-slate-200 rounded-2xl shadow-card hover:border-blue-300 hover:shadow-elevated transition-all"
            >
              <BarChart3 className="w-5 h-5 text-purple-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-900">Hiring Analytics</h3>
              <p className="text-xs text-slate-500 mt-1">Conversion rates, view counts, and hiring funnel.</p>
            </Link>
          </div>

        </div>

        {/* RIGHT COL: EMPLOYER PROFILE STUDIO CARD */}
        <div className="space-y-6">
          
          <Card className="p-6 bg-gradient-to-br from-white to-blue-50/40 border border-slate-200 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" /> Employer Branding
              </span>
              <Badge tone="accent">Verified</Badge>
            </div>

            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {companyName}
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-1 mb-4">
              {profile?.headline || "Semiconductor lab hiring freshers & researchers."}
            </p>

            <div className="space-y-2.5 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-700">
              <div className="flex items-center justify-between">
                <span>Recruiter Profile:</span>
                <Link href="/employer/profile" className="text-blue-600 hover:underline">
                  Edit Profile →
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <span>Public Handle:</span>
                <span className="font-mono text-slate-900">@{profile?.username || "recruiter"}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200">
              <Link
                href="/employer/profile"
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold rounded-xl py-2.5 text-xs hover:bg-slate-800 transition-colors"
              >
                Open Profile Studio <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* TEAM & PREFERENCES */}
          <Card className="p-5 space-y-3">
            <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Workspace Management</h4>
            
            <Link
              href="/employer/team"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 transition-all"
            >
              <span>Team &amp; Workspace Seats</span>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </Link>

            <Link
              href="/employer/company"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 transition-all"
            >
              <span>Company Logo &amp; Page</span>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </Link>

            <Link
              href="/employer/settings"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 transition-all"
            >
              <span>Notification Preferences</span>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </Link>
          </Card>

        </div>

      </div>

    </div>
  );
}
