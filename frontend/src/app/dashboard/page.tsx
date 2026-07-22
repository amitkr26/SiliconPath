"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Bookmark, FileText, Bell, Target,
  Loader2, ExternalLink, Clock,
  MapPin
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useApplications, useUpdateApplicationStatus } from "@/hooks/useApplications";
import { useProfile } from "@/hooks/useProfile";
import { api } from "@/lib/api-client";
import DeadlineCountdown from "@/components/DeadlineCountdown";

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
  applied: "bg-accent/15 text-accent border-accent/25",
  under_review: "bg-warning/15 text-warning border-warning/25",
  shortlisted: "bg-success/15 text-success border-success/25",
  rejected: "bg-danger/15 text-danger border-danger/25",
  accepted: "bg-success/15 text-success border-success/25",
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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 sm:w-8 sm:h-8 text-accent" />
            My Dashboard
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Track your applications and career progress
          </p>
        </div>
        <Link
          href="/resume"
          className="flex items-center justify-center gap-2 bg-accent text-bg-primary font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-accent-hover transition-all w-full sm:w-auto"
        >
          <FileText className="w-4 h-4" />
          Build Resume
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-accent" />
            </div>
            <span className="text-3xl font-bold text-text-primary font-display">{savedCount}</span>
          </div>
          <p className="text-text-secondary text-sm font-medium">Saved Opportunities</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <span className="text-3xl font-bold text-text-primary font-display">{appCount}</span>
          </div>
          <p className="text-text-secondary text-sm font-medium">Applications</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <span className="text-3xl font-bold text-text-primary font-display">{resumeScore}</span>
          </div>
          <p className="text-text-secondary text-sm font-medium">Resume ATS Score</p>
          {resumeScore === 0 && !profileLoading && (
            <p className="text-text-muted text-xs mt-1">Build your resume to get scored</p>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
              <Bell className="w-5 h-5 text-accent" />
            </div>
            <span className="text-3xl font-bold text-text-primary font-display">{alertCount}</span>
          </div>
          <p className="text-text-secondary text-sm font-medium">Active Alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="font-display text-lg font-bold text-text-primary mb-4">Application Tracker</h2>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary text-sm">No applications yet</p>
                <p className="text-text-muted text-xs mt-1">Start applying to opportunities to track them here</p>
                <Link
                  href="/opportunities"
                  className="inline-flex items-center gap-2 bg-accent text-bg-primary font-semibold rounded-lg px-4 py-2 text-sm mt-4 hover:bg-accent-hover transition-all"
                >
                  Browse Opportunities
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="flex items-start sm:items-center gap-3 p-3 bg-bg-primary rounded-lg border border-border/50">
                    <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                      <span className="text-accent text-xs font-bold">{getInitials(app.opportunity?.organization || "")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/opportunities/${app.opportunity?.slug}`}
                        className="text-text-primary text-sm font-medium hover:text-accent line-clamp-1"
                      >
                        {app.opportunity?.title}
                      </Link>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-0.5">
                        <Link
                          href={`/organizations/${orgSlug(app.opportunity?.organization || "")}`}
                          className="text-text-muted text-xs hover:text-accent"
                        >
                          {app.opportunity?.organization}
                        </Link>
                        {app.opportunity?.location && (
                          <span className="text-text-muted text-xs flex items-center gap-0.5">
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
                      className={`px-2 py-0.5 rounded-lg text-xs font-medium border outline-none cursor-pointer ${STATUS_STYLES[app.status] || STATUS_STYLES.applied}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key} className="bg-surface text-text-primary">{label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="font-display text-lg font-bold text-text-primary mb-4">Resume Score</h2>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-4">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="54" fill="none" stroke="#1E2A3F" strokeWidth="8" />
                  <circle
                    cx="64" cy="64" r="54" fill="none" stroke="#22D3EE" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(resumeCircularProgress / 100) * 339.292} 339.292`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-text-primary font-display">{resumeCircularProgress}</span>
                </div>
              </div>
              {resumeCircularProgress === 0 && (
                <div className="text-center">
                  <p className="text-text-muted text-xs text-center mb-4">Build your resume to receive an ATS score and improvement suggestions</p>
                  <Link href="/resume" className="inline-flex items-center gap-1 bg-accent text-bg-primary rounded-lg px-4 py-2 text-xs font-medium hover:bg-accent-hover transition-colors">
                    <FileText className="w-3 h-3" /> Build Resume →
                  </Link>
                </div>
              )}
              {resumeCircularProgress > 0 && (
                <Link href="/resume" className="text-accent text-xs font-medium hover:underline flex items-center justify-center gap-1">
                  <FileText className="w-3 h-3" /> View Resume
                </Link>
              )}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="font-display text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              Upcoming Deadlines
            </h2>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-6">No deadlines from your applications</p>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((app) => (
                  <div key={app.id} className="p-3 bg-bg-primary rounded-lg border border-border/50">
                    <Link
                      href={`/opportunities/${app.opportunity?.slug}`}
                      className="text-text-primary text-sm font-medium hover:text-accent line-clamp-1"
                    >
                      {app.opportunity?.title}
                    </Link>
                    <p className="text-text-muted text-xs mt-0.5">{app.opportunity?.organization}</p>
                    {app.opportunity?.deadline && (
                      <div className="mt-2">
                        <DeadlineCountdown deadline={app.opportunity.deadline} variant="progress" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
