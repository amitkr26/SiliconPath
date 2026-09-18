"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, Shield, ShieldOff, ShieldCheck, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import AdminNav from "../_components/AdminNav";

const ADMIN_TOKEN_KEY = "admin_token";

interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  account_type: string;
  account_status: string;
  banned_at: string | null;
  banned_reason: string | null;
  created_at: string;
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-950/60 text-emerald-400 border-emerald-500/30",
  suspended: "bg-amber-950/60 text-amber-400 border-amber-500/30",
  banned: "bg-red-950/60 text-red-400 border-red-500/30",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "ban" | "activate">("suspend");
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const pw = sessionStorage.getItem("admin_password");
    if (!token && !pw) { router.push("/admin"); return; }
    setAuthed(true);
  }, [router]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const data = await api.get<{ users?: User[]; total?: number }>(`/api/admin/users?${params}`);
      setUsers(data?.users || []);
      setTotal(data?.total || 0);
    } catch { setUsers([]); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (authed) load(); }, [authed, statusFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(); };

  const handleAction = async () => {
    if (!actionUser) return;
    setActing(true);
    try {
      await api.patch(`/api/admin/users/${actionUser.id}`, { action: actionType, reason: reason || undefined });
      toast.success(`User ${actionType === "activate" ? "reactivated" : actionType + "d"}`);
      setActionUser(null); setReason(""); load();
    } catch { toast.error("Action failed"); }
    setActing(false);
  };

  if (!authed) return (
    <div className="max-w-5xl mx-auto px-4 py-20 flex justify-center">
      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminNav title="User & Account Moderation" subtitle="Manage registered candidate and employer accounts" icon={Users} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="font-display text-2xl font-bold text-white">User Management</h1>
              <p className="text-slate-400 text-sm">{total} registered accounts</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, username, or email..."
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors">
              Search
            </button>
          </form>
          <div className="flex gap-1">
            {["", "active", "suspended", "banned"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  statusFilter === s
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* User Table */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400">No users found</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60 border-b border-slate-800">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">Joined</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 relative shrink-0">
                            {u.avatar_url ? (
                              <ImageWithFallback
                                src={u.avatar_url}
                                alt={u.display_name || u.username || "User"}
                                fallbackType="avatar"
                                fallbackName={u.display_name || u.username || "User"}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span>{getInitials(u.display_name || u.username || "User")}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{u.display_name || u.username}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 capitalize text-xs">{u.account_type || "candidate"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md border ${STATUS_COLORS[u.account_status || "active"] || STATUS_COLORS.active}`}>
                          {u.account_status || "active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        {(u.account_status || "active") === "active" ? (
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => { setActionUser(u); setActionType("suspend"); }}
                              className="p-1.5 text-amber-400 hover:bg-amber-950/40 rounded-lg transition-colors"
                              title="Suspend"
                            >
                              <ShieldOff className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setActionUser(u); setActionType("ban"); }}
                              className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                              title="Ban"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setActionUser(u); setActionType("activate"); }}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title="Reactivate"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Modal */}
        {actionUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-elevated max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">
                {actionType === "activate" ? "Reactivate" : actionType === "suspend" ? "Suspend" : "Ban"} User
              </h3>
              <p className="text-sm text-slate-300">
                {actionType === "activate"
                  ? `Reactivate ${actionUser.display_name || actionUser.username}? They will regain full access.`
                  : `${actionType === "suspend" ? "Suspend" : "Ban"} ${actionUser.display_name || actionUser.username}? They will${actionType === "ban" ? " permanently lose" : " temporarily lose"} access to the platform.`}
              </p>
              {actionType !== "activate" && (
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (optional, recorded in audit logs)"
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setActionUser(null); setReason(""); }}
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={acting}
                  className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
                    actionType === "activate" ? "bg-emerald-600 hover:bg-emerald-500" : actionType === "suspend" ? "bg-amber-600 hover:bg-amber-500" : "bg-red-600 hover:bg-red-500"
                  }`}
                >
                  {acting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : actionType === "activate" ? "Reactivate" : actionType === "suspend" ? "Suspend" : "Ban"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
