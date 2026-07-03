"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Search, UserPlus, UserCheck, UserX, Users,
  MessageCircle, Check, X, ArrowLeft, Clock
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

const TABS = [
  { key: "connections", label: "Connections", icon: Users },
  { key: "following", label: "Following", icon: UserCheck },
  { key: "followers", label: "Followers", icon: Users },
  { key: "sent", label: "Sent Requests", icon: ArrowLeft },
  { key: "received", label: "Received", icon: UserPlus },
  { key: "suggestions", label: "Suggestions", icon: UserCheck },
];

export default function NetworkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "connections");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [connections, setConnections] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "connections") {
        const res = await fetch(`/api/network/connections${search ? `?q=${search}` : ""}`);
        const data = await res.json();
        setConnections(data.connections || []);
      }
      if (activeTab === "followers") {
        const res = await fetch("/api/network/followers");
        const data = await res.json();
        setFollowers(data.followers || []);
      }
      if (activeTab === "following") {
        const res = await fetch("/api/network/following");
        const data = await res.json();
        setFollowing(data.following || []);
      }
      if (activeTab === "sent" || activeTab === "received") {
        const res = await fetch("/api/network/connect");
        const data = await res.json();
        setRequests(data.requests || []);
      }
      if (activeTab === "suggestions") {
        const res = await fetch("/api/network/suggestions?limit=20");
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch {}
    setLoading(false);
  }, [activeTab, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleConnect = async (receiverId: string) => {
    const res = await fetch("/api/network/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId }),
    });
    if (res.ok) {
      toast.success("Connection request sent!");
      loadData();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed");
    }
  };

  const handleAccept = async (id: string) => {
    const res = await fetch(`/api/network/connect/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    });
    if (res.ok) { toast.success("Connection accepted!"); loadData(); }
  };

  const handleDecline = async (id: string) => {
    const res = await fetch(`/api/network/connect/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "declined" }),
    });
    if (res.ok) { toast.success("Request declined"); loadData(); }
  };

  const handleWithdraw = async (id: string) => {
    const res = await fetch(`/api/network/connect/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Request withdrawn"); loadData(); }
  };

  const handleFollow = async (userId: string, currentlyFollowing: boolean) => {
    if (currentlyFollowing) {
      await fetch(`/api/network/follow/${userId}`, { method: "DELETE" });
      toast.success("Unfollowed");
    } else {
      await fetch(`/api/network/follow/${userId}`, { method: "POST" });
      toast.success("Following!");
    }
    loadData();
  };

  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login");
      else setCurrentUserId(data.user.id);
    });
  }, [router, supabase]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-6">My Network</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search (connections tab) */}
      {activeTab === "connections" && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connections..."
            className="w-full bg-surface border border-border text-text-primary text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-accent focus:border-accent outline-none"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
      ) : (
        <>
          {/* Connections */}
          {activeTab === "connections" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((p) => (
                <div key={p.id} className="bg-surface border border-border rounded-xl p-4">
                  <Link href={`/people/${p.username || p.id}`} className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-accent">{getInitials(p.full_name || "")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary text-sm font-medium truncate">{p.full_name}</p>
                      {p.headline && <p className="text-text-muted text-xs truncate">{p.headline}</p>}
                      {p.current_org && <p className="text-text-muted text-[10px] mt-0.5">{p.current_org}</p>}
                    </div>
                  </Link>
                  <div className="flex gap-2 mt-3">
                    <Link href={`/messages?user=${p.id}`} className="flex-1 flex items-center justify-center gap-1 bg-accent/20 text-accent border border-accent/30 rounded-lg py-1.5 text-xs font-medium hover:bg-accent/30 transition-colors">
                      <MessageCircle className="w-3 h-3" /> Message
                    </Link>
                  </div>
                </div>
              ))}
              {connections.length === 0 && (
                <div className="col-span-full text-center py-12 text-text-secondary">
                  {search ? "No matching connections" : "No connections yet. Connect with people to grow your network!"}
                </div>
              )}
            </div>
          )}

          {/* Followers */}
          {activeTab === "followers" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {followers.map((f) => (
                <div key={f.id} className="bg-surface border border-border rounded-xl p-4">
                  <Link href={`/people/${f.username || f.id}`} className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-accent">{getInitials(f.full_name || "")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary text-sm font-medium truncate">{f.full_name}</p>
                      {f.headline && <p className="text-text-muted text-xs truncate">{f.headline}</p>}
                    </div>
                  </Link>
                  <button
                    onClick={() => handleFollow(f.id, f.is_following_back)}
                    className={`w-full mt-3 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                      f.is_following_back
                        ? "bg-surface border border-border text-text-secondary"
                        : "bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30"
                    }`}
                  >
                    {f.is_following_back ? "Following" : "Follow Back"}
                  </button>
                </div>
              ))}
              {followers.length === 0 && (
                <div className="col-span-full text-center py-12 text-text-secondary">No followers yet</div>
              )}
            </div>
          )}

          {/* Following */}
          {activeTab === "following" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {following.map((f) => (
                <div key={f.id} className="bg-surface border border-border rounded-xl p-4">
                  <Link href={`/people/${f.username || f.id}`} className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-accent">{getInitials(f.full_name || "")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary text-sm font-medium truncate">{f.full_name}</p>
                      {f.headline && <p className="text-text-muted text-xs truncate">{f.headline}</p>}
                    </div>
                  </Link>
                  <button
                    onClick={() => handleFollow(f.id, true)}
                    className="w-full mt-3 flex items-center justify-center gap-1 bg-surface border border-border rounded-lg py-1.5 text-xs font-medium text-text-secondary hover:text-danger transition-colors"
                  >
                    Unfollow
                  </button>
                </div>
              ))}
              {following.length === 0 && (
                <div className="col-span-full text-center py-12 text-text-secondary">Not following anyone yet</div>
              )}
            </div>
          )}

          {/* Sent Requests */}
          {activeTab === "sent" && (
            <div className="space-y-3">
              {requests.filter((r) => r.sender_id === currentUserId).map((r) => (
                <div key={r.id} className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-accent">{getInitials(r.receiver?.full_name || "") || "?"}</span>
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-medium">{r.receiver?.full_name || "Unknown"}</p>
                      <p className="text-text-muted text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</p>
                    </div>
                  </div>
                  <button onClick={() => handleWithdraw(r.id)} className="flex items-center gap-1 text-xs text-danger hover:underline">Withdraw</button>
                </div>
              ))}
              {requests.filter((r) => r.sender_id === currentUserId).length === 0 && (
                <div className="text-center py-12 text-text-secondary">No pending requests</div>
              )}
            </div>
          )}

          {/* Received Requests */}
          {activeTab === "received" && (
            <div className="space-y-3">
              {requests.filter((r) => r.receiver_id === currentUserId && r.status === "pending").map((r) => (
                <div key={r.id} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Link href={`/people/${r.sender?.username || r.sender_id}`}>
                        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-accent">{getInitials(r.sender?.full_name || "")}</span>
                        </div>
                      </Link>
                      <div>
                        <Link href={`/people/${r.sender?.username || r.sender_id}`} className="text-text-primary text-sm font-medium hover:text-accent">
                          {r.sender?.full_name || "Unknown"}
                        </Link>
                        {r.sender?.headline && <p className="text-text-muted text-xs">{r.sender.headline}</p>}
                        {r.message && <p className="text-text-secondary text-xs mt-1 italic">&ldquo;{r.message}&rdquo;</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleAccept(r.id)} className="flex items-center gap-1 bg-success/20 text-success border border-success/30 rounded-lg px-4 py-1.5 text-xs font-medium hover:bg-success/30 transition-colors">
                      <Check className="w-3 h-3" /> Accept
                    </button>
                    <button onClick={() => handleDecline(r.id)} className="flex items-center gap-1 bg-danger/20 text-danger border border-danger/30 rounded-lg px-4 py-1.5 text-xs font-medium hover:bg-danger/30 transition-colors">
                      <X className="w-3 h-3" /> Decline
                    </button>
                  </div>
                </div>
              ))}
              {requests.filter((r) => r.receiver_id === currentUserId && r.status === "pending").length === 0 && (
                <div className="text-center py-12 text-text-secondary">No pending requests</div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {activeTab === "suggestions" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((s) => (
                <div key={s.id} className="bg-surface border border-border rounded-xl p-4">
                  <Link href={`/people/${s.username || s.id}`} className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-accent">{getInitials(s.full_name || "")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary text-sm font-medium truncate">{s.full_name}</p>
                      {s.headline && <p className="text-text-muted text-xs truncate">{s.headline}</p>}
                      {s.mutual_skills?.length > 0 && (
                        <p className="text-accent text-[10px] mt-1">{s.mutual_skills.length} mutual skill{s.mutual_skills.length > 1 ? "s" : ""}</p>
                      )}
                    </div>
                  </Link>
                  <button onClick={() => handleConnect(s.id)} className="w-full mt-3 flex items-center justify-center gap-1 bg-accent/20 text-accent border border-accent/30 rounded-lg py-1.5 text-xs font-medium hover:bg-accent/30 transition-colors">
                    <UserPlus className="w-3 h-3" /> Connect
                  </button>
                </div>
              ))}
              {suggestions.length === 0 && (
                <div className="col-span-full text-center py-12 text-text-secondary">No suggestions available</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
