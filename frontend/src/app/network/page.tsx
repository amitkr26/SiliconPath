"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, UserPlus, UserCheck, UserMinus, Search,
  Loader2, Check, X, Shield, ArrowRight, Sparkles,
  Briefcase, MessageSquare, HeartHandshake, Building2, Calendar, Newspaper
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type TabKey = "suggestions" | "received" | "sent" | "connections" | "followers" | "following";

const TAB_LABELS: Record<TabKey, string> = {
  suggestions: "Recommendations",
  received: "Received",
  sent: "Sent",
  connections: "Connections",
  followers: "Followers",
  following: "Following",
};

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-200" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          <div className="h-2.5 bg-slate-100 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2.5 bg-slate-100 rounded w-2/3" />
        <div className="h-2.5 bg-slate-100 rounded w-1/2" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-slate-100 rounded flex-1" />
        <div className="h-8 bg-slate-100 rounded flex-1" />
      </div>
    </div>
  );
}

export default function NetworkPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: userLoading } = useUser();
  const [tab, setTab] = useState<TabKey>("suggestions");
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);

  // Suggestions query
  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["network", "suggestions"],
    queryFn: async () => {
      const res = await api.get<{ suggestions: any[] }>("/api/network/suggestions");
      return res.suggestions || [];
    },
    enabled: !!user,
  });

  // Connections query
  const { data: connectionsData, isLoading: connectionsLoading } = useQuery({
    queryKey: ["connections"],
    queryFn: async () => {
      const res = await api.get<{ connections: any[] }>("/api/network/connections");
      return res.connections || [];
    },
    enabled: !!user,
  });

  const loadRequests = useCallback(async () => {
    try {
      setRequestsLoading(true);
      const res = await api.get<{ requests: any[] }>("/api/network/connect");
      setRequests(res.requests || []);
    } catch {
      // ignore
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const loadFollowersAndFollowing = useCallback(async () => {
    try {
      setSocialLoading(true);
      const [fRes, ingRes] = await Promise.all([
        api.get<{ followers: any[] }>("/api/network/followers"),
        api.get<{ following: any[] }>("/api/network/following"),
      ]);
      setFollowers(fRes.followers || []);
      setFollowing(ingRes.following || []);
    } catch {
      // ignore
    } finally {
      setSocialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "received" || tab === "sent") {
      loadRequests();
    } else if (tab === "followers" || tab === "following") {
      loadFollowersAndFollowing();
    }
  }, [tab, loadRequests, loadFollowersAndFollowing]);

  const connect = async (id: string) => {
    if (!id || id.startsWith("sug-")) {
      toast.error("Please select a registered candidate or engineer profile to connect.");
      return;
    }
    try {
      const res = await fetch("/api/network/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Connection request sent successfully!");
        queryClient.invalidateQueries({ queryKey: ["network", "suggestions"] });
      } else if (res.status === 409) {
        const existing = data?.connection as { status?: string } | undefined;
        toast.info(existing?.status === "accepted" ? "Already connected" : "Request already pending");
      } else {
        toast.error(data.error || "Failed to send connection request");
      }
    } catch {
      toast.error("Failed to send connection request");
    }
  };

  const disconnect = async (targetUserId: string) => {
    try {
      const res = await fetch("/api/network/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        toast.success("Connection removed");
        queryClient.invalidateQueries({ queryKey: ["connections"] });
      } else {
        toast.error("Failed to remove connection");
      }
    } catch {
      toast.error("Failed to remove connection");
    }
  };

  const respond = async (id: string, status: "accepted" | "rejected" | "withdrawn") => {
    try {
      const res = await fetch(`/api/network/connect/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(status === "accepted" ? "Connected successfully" : status === "withdrawn" ? "Request cancelled" : "Request declined");
        queryClient.invalidateQueries({ queryKey: ["connections"] });
        loadRequests();
      } else {
        toast.error(data.error || "Failed to update request");
      }
    } catch { /* ignore */ }
  };

  const handleUnfollow = async (targetUserId: string) => {
    try {
      await api.delete(`/api/network/follow/${targetUserId}`);
      toast.success("Unfollowed");
      loadFollowersAndFollowing();
    } catch {
      toast.error("Failed to unfollow");
    }
  };

  const handleFollow = async (targetUserId: string) => {
    try {
      await api.post(`/api/network/follow/${targetUserId}`);
      toast.success("Followed");
      queryClient.invalidateQueries({ queryKey: ["network", "suggestions"] });
    } catch {
      toast.error("Failed to follow");
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    router.push("/login?redirect=/network");
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const suggestions = suggestionsData || [];
  const connections = (connectionsData || []).filter((c: any) =>
    search ? (c.display_name || "").toLowerCase().includes(search.toLowerCase()) : true
  );
  const incomingRequests = requests.filter((r) => r.direction === "incoming");
  const outgoingRequests = requests.filter((r) => r.direction === "outgoing");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block space-y-4 sticky top-20 self-start">
            {/* Connection Stats */}
            <Card tone="flat" className="p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Network Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-slate-900">{connectionsData?.length || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Connections</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-slate-900">{followers.length || "—"}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Followers</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-slate-900">{following.length || "—"}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Following</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-blue-600">{incomingRequests.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Pending</p>
                </div>
              </div>
            </Card>

            {/* Quick Filters */}
            <Card tone="flat" className="p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Filters</h3>
              <div className="space-y-1">
                {([
                  ["suggestions", "Recommendations", Sparkles],
                  ["received", "Received Requests", UserPlus],
                  ["sent", "Sent Requests", ArrowRight],
                  ["connections", "Connections", Users],
                  ["followers", "Followers", HeartHandshake],
                  ["following", "Following", UserCheck],
                ] as [TabKey, string, any][]).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                      tab === key
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </span>
                    {key === "connections" && <span className="text-slate-400">{connectionsData?.length || 0}</span>}
                    {key === "followers" && <span className="text-slate-400">{followers.length || 0}</span>}
                    {key === "following" && <span className="text-slate-400">{following.length || 0}</span>}
                    {key === "received" && <span className="text-slate-400">{incomingRequests.length}</span>}
                    {key === "sent" && <span className="text-slate-400">{outgoingRequests.length}</span>}
                  </button>
                ))}
              </div>
            </Card>

            {/* Info Banner */}
            <Card tone="flat" className="p-5 bg-blue-50/50">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Verified Semiconductor Talent</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Connect with leading DRDO, ISRO, IIT researchers and fabless RTL verification engineers.
                  </p>
                </div>
              </div>
            </Card>
          </aside>

          {/* RIGHT CONTENT */}
          <div className="space-y-0 min-w-0">

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-900">Professional Network</h1>
              <p className="text-sm text-slate-500 mt-1">
                Connect and collaborate with semiconductor designers, verification leads, and researchers.
              </p>
            </div>

            {/* Tab Bar */}
            <div className="border-b border-slate-200 mb-6">
              <div className="flex items-center gap-0 overflow-x-auto no-scrollbar scrollbar-none">
                {(["suggestions", "received", "sent", "connections", "followers", "following"] as TabKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={cn(
                      "px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                      tab === k
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    )}
                  >
                    {TAB_LABELS[k]}
                    {k === "received" && incomingRequests.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full font-semibold">
                        {incomingRequests.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB: SUGGESTIONS */}
            {tab === "suggestions" && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-900">People You May Know in Semiconductor & VLSI</h2>
                {suggestionsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                ) : suggestions.length === 0 ? (
                  <Card tone="flat" className="p-12 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-700">No suggestions right now</h3>
                    <p className="text-xs text-slate-500 mt-1">Check back soon as more engineers join the network.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {suggestions.map((person: any) => (
                      <Card key={person.id} tone="flat" className="p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-slate-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={person.avatar_url || FALLBACK_AVATAR}
                                alt={person.display_name || "Engineer"}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <Link href={`/profile/${person.username || person.id}`} className="font-semibold text-sm text-slate-900 hover:text-blue-600 transition-colors block truncate">
                                {person.display_name || "Semiconductor Engineer"}
                              </Link>
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                {person.headline || person.current_company || "VLSI Specialist"}
                              </p>
                            </div>
                          </div>

                          {person.specialization && (
                            <p className="text-[11px] text-slate-500 mt-2 pl-15 ml-15">{person.specialization}</p>
                          )}

                          {person.skills && person.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {person.skills.slice(0, 3).map((skill: string) => (
                                <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full">
                                  {skill}
                                </span>
                              ))}
                              {person.skills.length > 3 && (
                                <span className="px-2 py-0.5 text-slate-400 text-[10px]">+{person.skills.length - 3}</span>
                              )}
                            </div>
                          )}

                          {person.mutual_connections_count > 0 && (
                            <p className="text-[11px] text-slate-500 mt-2 pl-0.5">
                              {person.mutual_connections_count} mutual connection{person.mutual_connections_count !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                          <Button
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => connect(person.id)}
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Connect
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1 text-xs"
                            onClick={() => handleFollow(person.id)}
                          >
                            Follow
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: RECEIVED */}
            {tab === "received" && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-900">Received Invitations</h2>
                {requestsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                ) : incomingRequests.length === 0 ? (
                  <Card tone="flat" className="p-12 text-center">
                    <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-700">No pending invitations</h3>
                    <p className="text-xs text-slate-500 mt-1">When colleagues invite you to connect, they will appear here.</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {incomingRequests.map((req) => {
                      const person: any = req.requester || {};
                      return (
                        <Card key={req.id} tone="flat" className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <Link href={`/profile/${person.username || person.id}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={person.avatar_url || FALLBACK_AVATAR}
                                  alt=""
                                  className="w-11 h-11 rounded-full object-cover"
                                />
                              </Link>
                              <div className="min-w-0">
                                <Link href={`/profile/${person.username || person.id}`} className="font-semibold text-sm text-slate-900 hover:text-blue-600 block truncate">
                                  {person.display_name}
                                </Link>
                                <p className="text-xs text-slate-500 truncate">{person.headline}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button size="sm" onClick={() => respond(req.id, "accepted")}>
                                Accept
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => respond(req.id, "rejected")}>
                                Decline
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: SENT */}
            {tab === "sent" && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-900">Sent Invitations</h2>
                {requestsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                ) : outgoingRequests.length === 0 ? (
                  <Card tone="flat" className="p-12 text-center">
                    <ArrowRight className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-700">No sent requests pending</h3>
                    <p className="text-xs text-slate-500 mt-1">Browse recommendations and connect with colleagues.</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {outgoingRequests.map((req) => {
                      const person: any = req.addressee || {};
                      return (
                        <Card key={req.id} tone="flat" className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <Link href={`/profile/${person.username || person.id}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={person.avatar_url || FALLBACK_AVATAR}
                                  alt=""
                                  className="w-11 h-11 rounded-full object-cover"
                                />
                              </Link>
                              <div className="min-w-0">
                                <Link href={`/profile/${person.username || person.id}`} className="font-semibold text-sm text-slate-900 hover:text-blue-600 block truncate">
                                  {person.display_name}
                                </Link>
                                <p className="text-xs text-slate-500 truncate">{person.headline}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => respond(req.id, "withdrawn")}>
                              Cancel
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: CONNECTIONS */}
            {tab === "connections" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-sm font-semibold text-slate-900">My Connections ({connections.length})</h2>
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter connections..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {connectionsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                ) : connections.length === 0 ? (
                  <Card tone="flat" className="p-12 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-700">No connections yet</h3>
                    <p className="text-xs text-slate-500 mt-1">Search for peers and expand your professional hardware network.</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {connections.map((c: any) => (
                      <Card key={c.id || c.user_id} tone="flat" className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <Link href={`/profile/${c.username || c.user_id}`}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={c.avatar_url || FALLBACK_AVATAR}
                                alt=""
                                className="w-11 h-11 rounded-full object-cover"
                              />
                            </Link>
                            <div className="min-w-0">
                              <Link href={`/profile/${c.username || c.user_id}`} className="font-semibold text-sm text-slate-900 hover:text-blue-600 block truncate">
                                {c.display_name}
                              </Link>
                              <p className="text-xs text-slate-500 truncate">{c.headline || c.current_company}</p>
                              {c.last_active && (
                                <p className="text-[10px] text-slate-400 mt-0.5">Active {new Date(c.last_active).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Link
                              href={`/messages?userId=${c.user_id || c.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Message
                            </Link>
                            <button
                              onClick={() => disconnect(c.user_id || c.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove connection"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: FOLLOWERS */}
            {tab === "followers" && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-900">Followers ({followers.length})</h2>
                {socialLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                ) : followers.length === 0 ? (
                  <Card tone="flat" className="p-12 text-center">
                    <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-700">No followers yet</h3>
                    <p className="text-xs text-slate-500 mt-1">As you share projects and post discussions, members will follow your updates.</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {followers.map((f: any) => (
                      <Card key={f.id} tone="flat" className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <Link href={`/profile/${f.username || f.id}`}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={f.avatar_url || FALLBACK_AVATAR}
                                alt=""
                                className="w-11 h-11 rounded-full object-cover"
                              />
                            </Link>
                            <div className="min-w-0">
                              <Link href={`/profile/${f.username || f.id}`} className="font-semibold text-sm text-slate-900 hover:text-blue-600 block truncate">
                                {f.display_name}
                              </Link>
                              <p className="text-xs text-slate-500 truncate">{f.headline}</p>
                            </div>
                          </div>
                          <Link
                            href={`/profile/${f.username || f.id}`}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex-shrink-0"
                          >
                            View Profile
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: FOLLOWING */}
            {tab === "following" && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-900">Following ({following.length})</h2>
                {socialLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                ) : following.length === 0 ? (
                  <Card tone="flat" className="p-12 text-center">
                    <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-700">Not following anyone yet</h3>
                    <p className="text-xs text-slate-500 mt-1">Follow leading semiconductor researchers and colleagues to see their updates.</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {following.map((f: any) => (
                      <Card key={f.id} tone="flat" className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <Link href={`/profile/${f.username || f.id}`}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={f.avatar_url || FALLBACK_AVATAR}
                                alt=""
                                className="w-11 h-11 rounded-full object-cover"
                              />
                            </Link>
                            <div className="min-w-0">
                              <Link href={`/profile/${f.username || f.id}`} className="font-semibold text-sm text-slate-900 hover:text-blue-600 block truncate">
                                {f.display_name}
                              </Link>
                              <p className="text-xs text-slate-500 truncate">{f.headline}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Link
                              href={`/profile/${f.username || f.id}`}
                              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Profile
                            </Link>
                            <button
                              onClick={() => handleUnfollow(f.id)}
                              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Unfollow
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
