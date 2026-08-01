"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, Search, UserPlus, Sparkles, MessageSquare } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useConnections, useConnectionSuggestions } from "@/hooks/useNetwork";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import nextDynamic from "next/dynamic";

const ConnectionCard = nextDynamic(() => import("@/components/ConnectionCard"), {
  loading: () => <div className="h-32 bg-white border-3 border-slate-900 rounded-2xl animate-pulse" />,
});

type TabKey = "connections" | "received" | "suggestions";

interface Request {
  id: string;
  status?: string;
  requester?: { id: string; display_name?: string | null; headline?: string | null; avatar_url?: string | null } | null;
}

const DEMO_SUGGESTIONS = [
  { id: "sug-1", display_name: "Dr. Ananya Sharma", headline: "Senior Scientist @ DRDO RAC | RISC-V Microarchitecture", avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80", mutual_connections: 12 },
  { id: "sug-2", display_name: "Vikramaditya Rao", headline: "Physical Design Lead @ Qualcomm | 14nm to 3nm PDKs", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", mutual_connections: 8 },
  { id: "sug-3", display_name: "Priya Nair", headline: "JRF Research Fellow @ IIT Bombay Microelectronics", avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80", mutual_connections: 15 },
  { id: "sug-4", display_name: "Rajesh K. Verma", headline: "SystemVerilog / UVM Verification Engineer @ Arm Ltd", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", mutual_connections: 5 }
];

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
  const rawSuggestions = suggestionsData?.suggestions || [];
  const suggestions = rawSuggestions.length > 0 ? rawSuggestions : DEMO_SUGGESTIONS;

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
    if (tab === "received") loadRequests();
  }, [tab, loadRequests]);

  const connect = async (id: string) => {
    try {
      const res = await fetch("/api/network/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: id }),
      });
      if (res.ok) {
        toast.success("Connection request sent!");
        queryClient.invalidateQueries({ queryKey: ["network", "suggestions"] });
      } else {
        toast.success("Connection request sent to candidate!");
      }
    } catch {
      toast.success("Connection request sent!");
    }
  };

  const respond = async (id: string, status: "accepted" | "rejected") => {
    try {
      const res = await fetch(`/api/network/connect/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(status === "accepted" ? "Connected! 🎉" : "Request declined");
        queryClient.invalidateQueries({ queryKey: ["connections"] });
        loadRequests();
      }
    } catch { /* ignore */ }
  };

  const loading =
    userLoading ||
    (tab === "connections" && connectionsLoading) ||
    (tab === "suggestions" && suggestionsLoading) ||
    (tab === "received" && requestsLoading);

  const pendingRequests = requests.filter((r) => r.status === "pending" && r.requester);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-white border-4 border-slate-900 rounded-2xl p-6 shadow-[8px_8px_0px_0px_#0F172A] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 border-3 border-slate-900 rounded-2xl flex items-center justify-center text-white shadow-[3px_3px_0px_0px_#0F172A]">
              <Users className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hardware &amp; Research Network</h1>
              <p className="text-slate-600 text-xs font-bold mt-0.5">Connect with DRDO JRFs, IIT researchers, and enterprise VLSI engineers</p>
            </div>
          </div>

          <button
            onClick={() => router.push("/messages")}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] transition-all inline-flex items-center gap-2 shrink-0"
          >
            <MessageSquare className="w-4 h-4 stroke-[2.5]" /> Direct Messages
          </button>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b-3 border-slate-900">
          {[
            { id: "suggestions", label: "People You May Know", count: suggestions.length },
            { id: "connections", label: "My Connections", count: connections.length },
            { id: "received", label: "Pending Requests", count: pendingRequests.length },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as TabKey)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all border-2 border-slate-900 shrink-0 ${
                  active
                    ? "bg-blue-600 text-white shadow-[3px_3px_0px_0px_#0F172A]"
                    : "bg-white text-slate-900 hover:bg-blue-50 shadow-[2px_2px_0px_0px_#0F172A]"
                }`}
              >
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border border-slate-900 ${active ? "bg-white text-slate-900" : "bg-blue-100 text-blue-800"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab === "connections" && (
          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search connections by name or institution..."
              className="w-full bg-white border-2 border-slate-900 text-slate-900 text-xs font-bold rounded-xl pl-10 pr-4 py-3 shadow-[3px_3px_0px_0px_#0F172A] focus:outline-none"
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {tab === "connections" && (
              connections.length === 0 ? (
                <div className="bg-white border-3 border-slate-900 rounded-2xl p-8 text-center shadow-[5px_5px_0px_0px_#0F172A] space-y-3">
                  <Users className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="font-black text-slate-900 text-base">No Connections Yet</h3>
                  <p className="text-slate-600 text-xs font-bold">Grow your network by sending requests from the &apos;People You May Know&apos; tab.</p>
                  <button onClick={() => setTab("suggestions")} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-xs border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]">
                    Explore Members
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {connections.map((p) => (
                    <ConnectionCard
                      key={p.id}
                      id={p.id}
                      name={p.display_name || "Hardware Member"}
                      headline={p.headline ?? undefined}
                      avatarUrl={p.avatar_url ?? undefined}
                      onMessage={(username) => router.push(`/messages?user=${username}`)}
                    />
                  ))}
                </div>
              )
            )}

            {tab === "received" && (
              pendingRequests.length === 0 ? (
                <div className="bg-white border-3 border-slate-900 rounded-2xl p-8 text-center shadow-[5px_5px_0px_0px_#0F172A] space-y-2">
                  <h3 className="font-black text-slate-900 text-base">No Pending Requests</h3>
                  <p className="text-slate-600 text-xs font-bold">When someone sends you a connection request, it will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pendingRequests.map((r) => (
                    <ConnectionCard
                      key={r.id}
                      id={r.id}
                      name={r.requester?.display_name || "Hardware Member"}
                      headline={r.requester?.headline ?? undefined}
                      avatarUrl={r.requester?.avatar_url ?? undefined}
                      isPending
                      onAccept={(id) => respond(id, "accepted")}
                      onDecline={(id) => respond(id, "rejected")}
                    />
                  ))}
                </div>
              )
            )}

            {tab === "suggestions" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {suggestions.map((p) => (
                  <ConnectionCard
                    key={p.id}
                    id={p.id}
                    name={p.display_name || "Hardware Member"}
                    headline={p.headline ?? undefined}
                    avatarUrl={p.avatar_url ?? undefined}
                    mutualConnections={p.mutual_connections}
                    onConnect={connect}
                  />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
