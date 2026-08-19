"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, Search, UserPlus, Sparkles, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useConnections, useConnectionSuggestions } from "@/hooks/useNetwork";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import nextDynamic from "next/dynamic";

const ConnectionCard = nextDynamic(() => import("@/components/ConnectionCard"), {
  loading: () => <div className="h-32 bg-white border-3 border-slate-900 rounded-2xl animate-pulse" />,
});

type TabKey = "suggestions" | "received" | "sent" | "connections";

interface Request {
  id: string;
  status?: string;
  direction?: "incoming" | "outgoing";
  requester?: { id: string; username?: string | null; display_name?: string | null; headline?: string | null; avatar_url?: string | null } | null;
  addressee?: { id: string; username?: string | null; display_name?: string | null; headline?: string | null; avatar_url?: string | null } | null;
}

export default function NetworkPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: userLoading } = useUser();
  const [tab, setTab] = useState<TabKey>("suggestions");
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<Request[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

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

  useEffect(() => {
    if (!userLoading && !user) router.push("/login?redirectTo=/network");
  }, [user, userLoading, router]);

  useEffect(() => {
    if (tab === "received" || tab === "sent") loadRequests();
  }, [tab, loadRequests]);

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
        // Duplicate — reflect the actual relationship state instead of hiding it.
        const existing = data?.connection as { status?: string } | undefined;
        toast.info(existing?.status === "accepted" ? "Already connected" : "Request already pending");
      } else {
        toast.error(data.error || "Failed to send connection request");
      }
    } catch {
      toast.error("Failed to send connection request");
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
        toast.success(status === "accepted" ? "Connected! 🎉" : status === "withdrawn" ? "Request cancelled" : "Request declined");
        queryClient.invalidateQueries({ queryKey: ["connections"] });
        loadRequests();
      } else {
        toast.error(data.error || "Failed to update request");
      }
    } catch { /* ignore */ }
  };

  if (userLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#0F172A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-xs font-black rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]">
              <Users className="w-4 h-4 stroke-[2.5]" />
              <span>SEMICONDUCTOR &amp; HARDWARE NETWORK</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
              Professional VLSI Network
            </h1>
            <p className="text-slate-600 text-xs font-semibold mt-1">
              Connect with DRDO scientists, ISRO engineers, IIT researchers, and global fabless microelectronics leaders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["suggestions", "received", "sent", "connections"] as TabKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-4 py-2 rounded-xl text-xs font-black border-2 border-slate-900 transition-all ${
                  tab === k
                    ? "bg-blue-600 text-white shadow-[3px_3px_0px_0px_#0F172A]"
                    : "bg-white text-slate-900 hover:bg-slate-100 shadow-[2px_2px_0px_0px_#0F172A]"
                }`}
              >
                {k === "suggestions" ? "Suggested Connections" : k === "received" ? "Received Requests" : k === "sent" ? "Sent Requests" : "My Connections"}
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT */}
        {tab === "suggestions" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900">Recommended Hardware Engineers &amp; Researchers</h2>
            {suggestionsLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="bg-white border-3 border-slate-900 rounded-2xl p-12 text-center shadow-[4px_4px_0px_0px_#0F172A]">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-black text-slate-900">No suggestions right now</h3>
                <p className="text-slate-600 text-xs mt-1">Check back soon as more engineers join the network.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.map((person: any) => (
                  <div
                    key={person.id}
                    onClick={() => router.push(`/profile/${person.username || person.id}`)}
                    className="bg-white border-3 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_0px_#0F172A] hover:shadow-[7px_7px_0px_0px_#0F172A] hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${person.username || person.id}`} className="shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={person.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                            alt={person.display_name || "Engineer"}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A] hover:ring-2 hover:ring-blue-500 transition-all"
                          />
                        </Link>
                        <div>
                          <Link href={`/profile/${person.username || person.id}`} className="font-black text-sm text-slate-900 hover:text-blue-600 transition-colors">
                            {person.display_name || "Berojgar Member"}
                          </Link>
                          {(person.headline || person.current_company) && (
                            <p className="text-[11px] font-bold text-slate-600 line-clamp-1">{person.headline || person.current_company}</p>
                          )}
                        </div>
                      </div>
                      {person.bio && (
                        <p className="text-xs text-slate-700 font-semibold leading-relaxed line-clamp-2">
                          {person.bio}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); connect(person.id); }}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] transition-all flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Connect
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/messages?user=${person.id}`); }}
                        className="p-2 bg-white hover:bg-slate-100 text-slate-900 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A] transition-all"
                        title="Send Message"
                      >
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "received" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900">Connection Requests</h2>
            {requestsLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white border-3 border-slate-900 rounded-2xl p-12 text-center shadow-[4px_4px_0px_0px_#0F172A]">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-black text-slate-900">No pending connection requests</h3>
                <p className="text-slate-600 text-xs mt-1">When engineers send you connection requests, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.filter((req) => req.direction === "incoming").map((req) => {
                  const otherName = req.requester?.display_name || "Engineer";
                  const otherAvatar = req.requester?.avatar_url || "";
                  const otherHeadline = req.requester?.headline || "Hardware Engineer";
                  const otherProfile = `/profile/${req.requester?.username || req.requester?.id || "#"}`;
                  return (
                    <div
                      key={req.id}
                      onClick={() => otherProfile !== "#" && router.push(otherProfile)}
                      className="bg-white border-3 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_#0F172A] flex items-center justify-between gap-4 cursor-pointer hover:shadow-[6px_6px_0px_0px_#0F172A] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Link href={otherProfile} className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={otherAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                            alt={otherName}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-slate-900 hover:ring-2 hover:ring-blue-500 transition-all"
                          />
                        </Link>
                        <div>
                          <Link href={otherProfile} className="font-black text-sm text-slate-900 hover:text-blue-600 transition-colors" onClick={(e) => e.stopPropagation()}>
                            {otherName}
                          </Link>
                          <p className="text-xs text-slate-600 font-semibold">{otherHeadline}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); respond(req.id, "accepted"); }}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 text-xs font-black border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_#0F172A]"
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); respond(req.id, "rejected"); }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-black border-2 border-slate-900 rounded-xl"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "sent" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900">Sent Requests</h2>
            {requestsLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : requests.filter((req) => req.direction === "outgoing").length === 0 ? (
              <div className="bg-white border-3 border-slate-900 rounded-2xl p-12 text-center shadow-[4px_4px_0px_0px_#0F172A]">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-black text-slate-900">No sent requests</h3>
                <p className="text-slate-600 text-xs mt-1">Connection requests you send will appear here until the recipient responds.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.filter((req) => req.direction === "outgoing").map((req) => {
                  const otherProfile = `/profile/${req.addressee?.username || req.addressee?.id || "#"}`;
                  return (
                    <div
                      key={req.id}
                      onClick={() => otherProfile !== "#" && router.push(otherProfile)}
                      className="bg-white border-3 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_#0F172A] flex items-center justify-between gap-4 cursor-pointer hover:shadow-[6px_6px_0px_0px_#0F172A] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Link href={otherProfile} className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={req.addressee?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                            alt={req.addressee?.display_name || "Engineer"}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-slate-900 hover:ring-2 hover:ring-blue-500 transition-all"
                          />
                        </Link>
                        <div>
                          <Link href={otherProfile} className="font-black text-sm text-slate-900 hover:text-blue-600 transition-colors" onClick={(e) => e.stopPropagation()}>
                            {req.addressee?.display_name || "Engineer"}
                          </Link>
                          <p className="text-xs text-slate-600 font-semibold">
                            {req.addressee?.headline || "Hardware Engineer"} — awaiting response
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); respond(req.id, "withdrawn"); }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-black border-2 border-slate-900 rounded-xl"
                      >
                        Cancel Request
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "connections" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900">My Network Connections ({connections.length})</h2>
            {connectionsLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : connections.length === 0 ? (
              <div className="bg-white border-3 border-slate-900 rounded-2xl p-12 text-center shadow-[4px_4px_0px_0px_#0F172A]">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-black text-slate-900">No active connections yet</h3>
                <p className="text-slate-600 text-xs mt-1">Connect with candidate engineers and employers under &apos;Suggested Connections&apos;.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {connections.map((c: any) => (
                  <ConnectionCard
                    key={c.id || c.user_id}
                    id={c.id || c.user_id}
                    name={c.display_name || c.name || "Hardware Engineer"}
                    username={c.username}
                    headline={c.headline}
                    avatarUrl={c.avatar_url || c.avatarUrl}
                    onOpen={() => router.push(`/profile/${c.username || c.id || c.user_id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
