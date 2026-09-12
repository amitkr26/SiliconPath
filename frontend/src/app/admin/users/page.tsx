"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, Shield, ShieldOff, ShieldCheck, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

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
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  suspended: "bg-amber-100 text-amber-700 border-amber-200",
  banned: "bg-red-100 text-red-700 border-red-200",
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <Users className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">User Management</h1>
        <span className="text-sm text-gray-500 ml-2">{total} users</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username, or email..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Search</button>
        </form>
        <div className="flex gap-1">
          {["", "active", "suspended", "banned"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border ${statusFilter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No users found</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full" /> : getInitials(u.display_name || u.username || "?")}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.display_name || u.username}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{u.account_type || "candidate"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${STATUS_COLORS[u.account_status || "active"] || STATUS_COLORS.active}`}>
                      {u.account_status || "active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {(u.account_status || "active") === "active" ? (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => { setActionUser(u); setActionType("suspend"); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Suspend"><ShieldOff className="w-4 h-4" /></button>
                        <button onClick={() => { setActionUser(u); setActionType("ban"); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Ban"><Shield className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setActionUser(u); setActionType("activate"); }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Reactivate"><ShieldCheck className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modal */}
      {actionUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {actionType === "activate" ? "Reactivate" : actionType === "suspend" ? "Suspend" : "Ban"} User
            </h3>
            <p className="text-sm text-gray-600">
              {actionType === "activate"
                ? `Reactivate ${actionUser.display_name || actionUser.username}? They will regain full access.`
                : `${actionType === "suspend" ? "Suspend" : "Ban"} ${actionUser.display_name || actionUser.username}? They will${actionType === "ban" ? " permanently lose" : " temporarily lose"} access to the platform.`}
            </p>
            {actionType !== "activate" && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional, shown to user)"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setActionUser(null); setReason(""); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button
                onClick={handleAction}
                disabled={acting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${actionType === "activate" ? "bg-emerald-600 hover:bg-emerald-700" : actionType === "suspend" ? "bg-amber-600 hover:bg-amber-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {acting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : actionType === "activate" ? "Reactivate" : actionType === "suspend" ? "Suspend" : "Ban"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
