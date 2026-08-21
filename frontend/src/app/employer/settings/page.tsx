"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings, ArrowLeft, Bell, Shield, Mail, Save,
  CheckCircle2, Loader2, Building2
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function EmployerSettingsPage() {
  const router = useRouter();
  const { user, username, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [instantApplicantAlert, setInstantApplicantAlert] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirectTo=/employer/settings");
      return;
    }
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isEmployer, isAdmin, authLoading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await new Promise((r) => setTimeout(r, 500));
      toast.success("Settings saved successfully!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase">Loading Settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/employer/dashboard" className="text-xs font-bold text-slate-500 hover:text-blue-600">
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-blue-600" /> Employer Settings &amp; Preferences
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-medium">
            Configure applicant notification alerts, recruiting preferences, and account security.
          </p>
        </div>

        {/* NOTIFICATIONS PREFERENCES */}
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-black text-slate-900 border-b-2 border-slate-900 pb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" /> Applicant &amp; Candidate Alerts
            </h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-900 rounded-xl cursor-pointer">
                <div>
                  <p className="text-xs font-black text-slate-900">Instant Application Notification</p>
                  <p className="text-[11px] text-slate-500 font-medium">Receive an email immediately when a candidate submits an application.</p>
                </div>
                <input
                  type="checkbox"
                  checked={instantApplicantAlert}
                  onChange={(e) => setInstantApplicantAlert(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-900 rounded-xl cursor-pointer">
                <div>
                  <p className="text-xs font-black text-slate-900">Direct Candidate Message Alerts</p>
                  <p className="text-[11px] text-slate-500 font-medium">Get notified when a candidate responds to your recruitment outreach.</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-900 rounded-xl cursor-pointer">
                <div>
                  <p className="text-xs font-black text-slate-900">Weekly Talent Digest</p>
                  <p className="text-[11px] text-slate-500 font-medium">Summary of newly open-to-work hardware scholars matching your domain.</p>
                </div>
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t-2 border-slate-900">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Preferences</span>
              </Button>
            </div>
          </Card>
        </form>

      </div>
    </div>
  );
}
