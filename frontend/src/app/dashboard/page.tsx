"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bookmark, FileText, Bell, Target,
  Loader2, Clock, MapPin
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useApplications, useUpdateApplicationStatus } from "@/hooks/useApplications";
import { useProfile } from "@/hooks/useProfile";
import { api } from "@/lib/api-client";
import DeadlineCountdown from "@/components/DeadlineCountdown";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface ApplicationWithOpportunity {
  id: string;
  status: string;
  applied_at: string;
  opportunity: {
    title: string;
    organization: string;
    slug: string;
    deadline: string | null;
    location: string | null;
  };
}

interface BookmarksResponse {
  count: number;
}

interface AlertsResponse {
  count: number;
}

function getInitials(str: string): string {
  return str.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

function orgSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const STATUS_STYLES: Record<string, string> = {
  applied: "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  shortlisted: "bg-purple-50 text-purple-700",
  rejected: "bg-red-50 text-red-700",
  accepted: "bg-emerald-50 text-emerald-700",
};

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  accepted: "Accepted",
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { data: appsData, isLoading: appsLoading } = useApplications();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateStatus = useUpdateApplicationStatus();

  const [savedCount, setSavedCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      api.get<BookmarksResponse>("/api/bookmarks", { params: { limit: 1, offset: 0 } }),
      api.get<AlertsResponse>("/api/alerts"),
    ]).then(([bookmarksRes, alertsRes]) => {
      setSavedCount(bookmarksRes.count ?? 0);
      setAlertCount(alertsRes.count ?? 0);
    });
  }, [user]);

  if (authLoading || appsLoading || profileLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-bg-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const applications: ApplicationWithOpportunity[] = (appsData?.applications ?? []).map((a: any) => ({
    id: a.id,
    status: a.status,
    applied_at: a.applied_at,
    opportunity: Array.isArray(a.opportunity) ? a.opportunity[0] : a.opportunity,
  }));

  const appCount = appsData?.count ?? applications.length;
  const resumeScore = (profile as any)?.resume_ats_score ?? 0;

  const upcomingDeadlines = applications
    .filter((a) => a.opportunity?.deadline)
    .sort((a, b) => new Date(a.opportunity.deadline!).getTime() - new Date(b.opportunity.deadline!).getTime())
    .slice(0, 5);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    updateStatus.mutate({ id: appId, status: newStatus });
  };

  const resumeCircularProgress = resumeScore;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Career Hub"
          title="My Dashboard"
          description="Track your applications and career progress"
          action={
            <Button href="/resume">
              <FileText className="w-4 h-4" />
              Build Resume
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-slate-900 flex items-center justify-center shadow-brutal-sm">
                <Bookmark className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-3xl font-black text-slate-900">{savedCount}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Saved Opportunities</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-slate-900 flex items-center justify-center shadow-brutal-sm">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-3xl font-black text-slate-900">{appCount}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Applications</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-slate-900 flex items-center justify-center shadow-brutal-sm">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-3xl font-black text-slate-900">{resumeScore}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Resume ATS Score</p>
            {resumeScore === 0 && !profileLoading && (
              <p className="text-xs font-medium text-slate-400 mt-1">Build your resume to get scored</p>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-slate-900 flex items-center justify-center shadow-brutal-sm">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-3xl font-black text-slate-900">{alertCount}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Active Alerts</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-lg font-black text-slate-900 mb-4">Application Tracker</h2>
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm font-semibold">No applications yet</p>
                  <p className="text-slate-400 text-xs mt-1">Start applying to opportunities to track them here</p>
                  <Button href="/opportunities" size="sm" className="mt-4">
                    Browse Opportunities
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-start sm:items-center gap-3 p-3 bg-bg-primary border-2 border-slate-900 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-blue-50 border-2 border-slate-900 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                        <span className="text-blue-700 text-xs font-bold">{getInitials(app.opportunity?.organization || "")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/opportunities/${app.opportunity?.slug}`}
                          className="text-slate-900 text-sm font-bold hover:text-blue-600 line-clamp-1"
                        >
                          {app.opportunity?.title}
                        </Link>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-0.5">
                          <Link
                            href={`/organizations/${orgSlug(app.opportunity?.organization || "")}`}
                            className="text-slate-500 text-xs font-medium hover:text-blue-600"
                          >
                            {app.opportunity?.organization}
                          </Link>
                          {app.opportunity?.location && (
                            <span className="text-slate-500 text-xs flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              {app.opportunity.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        disabled={updateStatus.isPending}
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold border-2 border-slate-900 shadow-brutal-sm outline-none cursor-pointer ${STATUS_STYLES[app.status] || STATUS_STYLES.applied}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key} className="bg-white text-slate-900">{label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-black text-slate-900 mb-4">Resume Score</h2>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="54" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                    <circle
                      cx="64" cy="64" r="54" fill="none" stroke="#2563EB" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(resumeCircularProgress / 100) * 339.292} 339.292`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-black text-slate-900">{resumeCircularProgress}</span>
                  </div>
                </div>
                {resumeCircularProgress === 0 && (
                  <div className="text-center">
                    <p className="text-slate-500 text-xs font-medium text-center mb-4">Build your resume to receive an ATS score and improvement suggestions</p>
                    <Button href="/resume" size="sm">
                      <FileText className="w-3 h-3" /> Build Resume
                    </Button>
                  </div>
                )}
                {resumeCircularProgress > 0 && (
                  <Link href="/resume" className="text-blue-600 text-xs font-bold hover:underline flex items-center justify-center gap-1">
                    <FileText className="w-3 h-3" /> View Resume
                  </Link>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Upcoming Deadlines
              </h2>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-slate-500 text-sm font-medium text-center py-6">No deadlines from your applications</p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map((app) => (
                    <div key={app.id} className="p-3 bg-bg-primary border-2 border-slate-900 rounded-xl">
                      <Link
                        href={`/opportunities/${app.opportunity?.slug}`}
                        className="text-slate-900 text-sm font-bold hover:text-blue-600 line-clamp-1"
                      >
                        {app.opportunity?.title}
                      </Link>
                      <p className="text-slate-500 text-xs font-medium mt-0.5">{app.opportunity?.organization}</p>
                      {app.opportunity?.deadline && (
                        <div className="mt-2">
                          <DeadlineCountdown deadline={app.opportunity.deadline} variant="progress" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}