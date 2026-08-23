"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, UserPlus, Sparkles, MessageSquare, UserCheck, UserMinus, Search, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useConnections, useConnectionSuggestions } from "@/hooks/useNetwork";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

type TabKey = "suggestions" | "received" | "sent" | "connections" | "followers" | "following";

const TAB_LABELS: Record<TabKey, string> = {
  suggestions: "Suggested Connections",
  received: "Received Requests",
  sent: "Sent Requests",
  connections: "My Connections",
  followers: "Followers",
  following: "Following",
};

interface Request {
  id: string;
  status?: string;
  direction?: "incoming" | "outgoing";
  requester?: { id: string; username?: string | null; display_name?: string | null; headline?: string | null; avatar_url?: string | null } | null;
  addressee?: { id: string; username?: string | null; display_name?: string | null; headline?: string | null; avatar_url?: string | null } | null;
}

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

export default function NetworkPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: userLoading } = useUser();
  const [tab, setTab] = useState<TabKey>("suggestions");
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<Request[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);

  const { data: connectionsData, isLoading: connectionsLoading } = useConnections(
    tab === "connections" ? search : undefined
  );
  const { data: suggestionsData, isLoading: suggestionsLoading } = useConnectionSuggestions();

  const connections = connectionsData?.connections || [];
  const suggestions = suggestionsData?.suggestions || [];

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await fetch("/api/network/connect");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch { /* ignore */ }
    setRequestsLoading(false);
  }, []);

  const loadFollowersAndFollowing = useCallback(async () => {
    setSocialLoading(true);
    try {
      const [fRes, ingRes] = await Promise.all([
        fetch("/api/network/followers").then((r) => (r.ok ? r.json() : { followers: [] })),
        fetch("/api/network/following").then((r) => (r.ok ? r.json() : { following: [] })),
      ]);
      setFollowers(fRes.followers || []);
      setFollowing(ingRes.following || []);
    } catch { /* ignore */ }
    setSocialLoading(false);
  }, []);

  useEffect(() => {
    if (!userLoading && !user) router.push("/login?redirectTo=/network");
  }, [user, userLoading, router]);

  useEffect(() => {
    if (tab === "received" || tab === "sent") loadRequests();
    if (tab === "followers" || tab === "following") loadFollowersAndFollowing();
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

  if (userLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <Card className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <Badge tone="accent" className="mb-3">
              <Users className="w-3.5 h-3.5" />
              Semiconductor &amp; Hardware Network
            </Badge>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Professional VLSI Network
            </h1>
            <p className="text-slate-600 text-sm font-medium mt-1.5">
              Connect with DRDO scientists, ISRO engineers, IIT researchers, and global fabless microelectronics leaders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["suggestions", "received", "sent", "connections", "followers", "following"] as TabKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-black border-2 border-slate-900 transition-all",
                  tab === k
                    ? "bg-blue-600 text-white shadow-brutal-sm"
                    : "bg-white text-slate-900 hover:bg-slate-100",
                )}
              >
                {TAB_LABELS[k]}
              </button>
            ))}
          </div>
        </Card>

        {/* TAB CONTENT: SUGGESTIONS */}
        {tab === "suggestions" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900">Recommended Hardware Engineers &amp; Researchers</h2>
            {suggestionsLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : suggestions.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-black text-slate-900">No suggestions right now</h3>
                <p className="text-slate-600 text-xs mt-1 font-medium">Check back soon as more engineers join the network.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.map((person: any) => (
                  <Card
                    key={person.id}
                    hover
                    className="p-6 flex flex-col justify-between cursor-pointer"
                    onClick={() => router.push(`/profile/${person.username || person.id}`)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${person.username || person.id}`} className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={person.avatar_url || FALLBACK_AVATAR}
                            alt={person.display_name || "Engineer"}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-slate-900 shadow-brutal-sm hover:ring-2 hover:ring-blue-500 transition-all"
                          />
                        </Link>
                        <div>
                          <Link href={`/profile/${person.username || person.id}`} className="font-black text-sm text-slate-900 hover:text-blue-600 transition-colors" onClick={(e) => e.stopPropagation()}>
                            {person.display_name || "Berojgar Member"}
                          </Link>
                          {(person.headline || person.current_company) && (
                            <p className="text-[11px] font-semibold text-slate-600 line-clamp-1">{person.headline || person.current_company}</p>
                          )}
                        </div>
                      </div>

                      {person.mutual_connections_count > 0 && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <HeartHandshake className="w-3 h-3" /> {person.mutual_connections_count} mutual connection{person.mutual_connections_count > 1 ? "s" : ""}
                        </div>
                      )}

                      {person.bio && (
                        <p className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-2">
                          {person.bio}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 flex items-center gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={(e) => { e.stopPropagation(); connect(person.id); }}
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Connect
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="px-2.5"
                        ariaLabel="Send Message"
                        onClick={(e) => { e.stopPropagation(); router.push(`/messages?userId=${person.id}`); }}
                      >
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: RECEIVED */}
        {tab === "received" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900">Received Connection Requests</h2>
            {requestsLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : requests.filter((req) => req.direction === "incoming").length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-black text-slate-900">No pending requests</h3>
                <p className="text-slate-600 text-xs mt-1 font-medium">When engineers send you connection requests, they will show up here.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.filter((r) => r.direction === "incoming").map((req) => {
                  const person: any = req.requester || {};
                  return (
                    <Card key={req.id} className="p-6 space-y-4 flex flex-col justify-between">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${person.username || person.id}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={person.avatar_url || FALLBACK_AVATAR}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border-2 border-slate-900"
                          />
                        </Link>
                        <div>
                          <Link href={`/profile/${person.username || person.id}`} className="font-black text-sm text-slate-900 hover:text-blue-600">
                            {person.display_name}
                          </Link>
                          <p className="text-[11px] font-semibold text-slate-600 line-clamp-1">{person.headline}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => respond(req.id, "accepted")}>
                          <UserCheck className="w-3.5 h-3.5" /> Accept
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => respond(req.id, "rejected")}>
                          Decline
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: SENT */}
        {tab === "sent" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900">Sent Connection Requests</h2>
            {requestsLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : requests.filter((req) => req.direction === "outgoing").length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-black text-slate-900">No sent requests pending</h3>
                <p className="text-slate-600 text-xs mt-1 font-medium">Browse recommendations and connect with colleagues.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.filter((r) => r.direction === "outgoing").map((req) => {
                  const person: any = req.addressee || {};
                  return (
                    <Card key={req.id} className="p-6 space-y-4 flex flex-col justify-between">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${person.username || person.id}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={person.avatar_url || FALLBACK_AVATAR}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border-2 border-slate-900"
                          />
                        </Link>
                        <div>
                          <Link href={`/profile/${person.username || person.id}`} className="font-black text-sm text-slate-900 hover:text-blue-600">
                            {person.display_name}
                          </Link>
                          <p className="text-[11px] font-semibold text-slate-600 line-clamp-1">{person.headline}</p>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => respond(req.id, "withdrawn")}>
                        Cancel Request
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: CONNECTIONS */}
        {tab === "connections" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-black text-slate-900">My Connections ({connections.length})</h2>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter connections..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            {connectionsLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : connections.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-black text-slate-900">No connections yet</h3>
                <p className="text-slate-600 text-xs mt-1 font-medium">Search for peers and expand your professional hardware network.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {connections.map((c: any) => (
                  <Card key={c.id || c.user_id} className="p-6 space-y-4 flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${c.username || c.user_id}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.avatar_url || FALLBACK_AVATAR}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border-2 border-slate-900"
                        />
                      </Link>
                      <div>
                        <Link href={`/profile/${c.username || c.user_id}`} className="font-black text-sm text-slate-900 hover:text-blue-600">
                          {c.display_name}
                        </Link>
                        <p className="text-[11px] font-semibold text-slate-600 line-clamp-1">{c.headline || c.current_company}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/messages?userId=${c.user_id || c.id}`}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold text-center border-2 border-slate-900 shadow-brutal-sm"
                      >
                        Message
                      </Link>
                      <button
                        onClick={() => disconnect(c.user_id || c.id)}
                        className="px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs font-bold border-2 border-slate-900"
                        title="Remove connection"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: FOLLOWERS */}
        {tab === "followers" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900">Followers ({followers.length})</h2>
            {socialLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : followers.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-black text-slate-900">No followers yet</h3>
                <p className="text-slate-600 text-xs mt-1 font-medium">As you share projects and post articles, members will follow your work.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {followers.map((f: any) => (
                  <Card key={f.id} className="p-6 space-y-4 flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${f.username || f.id}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={f.avatar_url || FALLBACK_AVATAR}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border-2 border-slate-900"
                        />
                      </Link>
                      <div>
                        <Link href={`/profile/${f.username || f.id}`} className="font-black text-sm text-slate-900 hover:text-blue-600">
                          {f.display_name}
                        </Link>
                        <p className="text-[11px] font-semibold text-slate-600 line-clamp-1">{f.headline}</p>
                      </div>
                    </div>
                    <Link
                      href={`/profile/${f.username || f.id}`}
                      className="w-full py-2 bg-white text-slate-900 rounded-xl text-xs font-bold text-center border-2 border-slate-900 shadow-brutal-sm"
                    >
                      View Profile
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: FOLLOWING */}
        {tab === "following" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900">Following ({following.length})</h2>
            {socialLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : following.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-black text-slate-900">Not following anyone yet</h3>
                <p className="text-slate-600 text-xs mt-1 font-medium">Follow leading semiconductor researchers and colleagues to see their updates.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {following.map((f: any) => (
                  <Card key={f.id} className="p-6 space-y-4 flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${f.username || f.id}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={f.avatar_url || FALLBACK_AVATAR}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border-2 border-slate-900"
                        />
                      </Link>
                      <div>
                        <Link href={`/profile/${f.username || f.id}`} className="font-black text-sm text-slate-900 hover:text-blue-600">
                          {f.display_name}
                        </Link>
                        <p className="text-[11px] font-semibold text-slate-600 line-clamp-1">{f.headline}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/profile/${f.username || f.id}`}
                        className="flex-1 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold text-center border-2 border-slate-900 shadow-brutal-sm"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => handleUnfollow(f.id)}
                        className="px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-xl text-xs font-bold border-2 border-slate-900"
                      >
                        Unfollow
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}