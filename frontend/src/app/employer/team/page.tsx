"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, ArrowLeft, Shield, Mail, Plus, UserCheck,
  ShieldCheck, Loader2, Trash2
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function EmployerTeamPage() {
  const router = useRouter();
  const { user, username, displayName, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("recruiter");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirectTo=/employer/team");
      return;
    }
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isEmployer, isAdmin, authLoading, router]);

  const loadTeam = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch("/api/employer/team");
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      setInviting(true);
      const res = await fetch("/api/employer/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation");
      toast.success(data.message || `Team invitation sent to ${inviteEmail}!`);
      setInviteEmail("");
      loadTeam();
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase">Loading Team Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/employer/dashboard" className="text-xs font-bold text-slate-500 hover:text-blue-600">
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600" /> Recruiting Team &amp; Seats
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-medium">
            Manage organization members, hiring managers, and recruiter permissions for your lab workspace.
          </p>
        </div>

        {/* TEAM MEMBERS LIST */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <h2 className="text-base font-black text-slate-900">Active Workspace Members</h2>
            <Badge tone="accent">{members.length} of 5 Seats Active</Badge>
          </div>

          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id || m.email} className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-brutal-sm">
                    {(m.display_name?.[0] || m.email?.[0] || "U").toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-900">{m.display_name || m.email?.split("@")[0]}</p>
                      {m.username && (
                        <span className="text-xs font-bold text-blue-700">@{m.username}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{m.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 border text-xs font-black rounded-lg ${
                    m.is_owner
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                  }`}>
                    {m.role || "Recruiter"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* INVITE CO-RECRUITER */}
        <Card className="p-6 sm:p-8 space-y-5">
          <h2 className="text-base font-black text-slate-900 border-b-2 border-slate-900 pb-3">
            Invite Hiring Manager or Co-Recruiter
          </h2>

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@yourcompany.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Workspace Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                >
                  <option value="recruiter">Recruiter (Post &amp; Screen)</option>
                  <option value="hiring_manager">Hiring Manager (Review Only)</option>
                  <option value="admin">Workspace Admin</option>
                </select>
              </div>
            </div>

            <Button type="submit" disabled={inviting}>
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Send Workspace Invite</span>
            </Button>
          </form>
        </Card>

      </div>
    </div>
  );
}
