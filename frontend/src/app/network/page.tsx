"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, Search } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useConnections, useConnectionSuggestions } from "@/hooks/useNetwork";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Tabs from "@/components/shared/Tabs";
import EmptyState from "@/components/shared/EmptyState";
import ConnectionCard from "@/components/ConnectionCard";

type TabKey = "connections" | "received" | "suggestions";

interface Request {
  id: string;
  status?: string;
  requester?: { id: string; display_name?: string | null; headline?: string | null; avatar_url?: string | null } | null;
}

const TABS = [
  { id: "connections", label: "My Connections" },
  { id: "received", label: "Pending Requests" },
  { id: "suggestions", label: "People You May Know" },
];

export default function NetworkPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: userLoading } = useUser();
  const [tab, setTab] = useState<TabKey>("connections");
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
        toast.error("Failed to send request");
      }
    } catch { toast.error("Failed"); }
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
    <div className="min-h-screen bg-[var(--bg)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Users size={24} className="text-[var(--primary)]" />
          <h1 className="text-2xl font-bold text-[var(--text)]">My Network</h1>
        </div>

        <Tabs
          tabs={TABS.map((t) => ({
            ...t,
            badge: t.id === "received" ? pendingRequests.length : undefined,
          }))}
          activeTab={tab}
          onChange={(id) => setTab(id as TabKey)}
          className="mb-6"
        />

        {tab === "connections" && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search connections..."
              className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-[var(--primary)] outline-none transition"
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
          </div>
        ) : (
          <>
            {tab === "connections" && (
              connections.length === 0 ? (
                <EmptyState
                  icon={<Users size={28} />}
                  title={search ? "No matching connections" : "No connections yet"}
                  description={search ? "Try a different name." : "Grow your network from the 'People You May Know' tab."}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {connections.map((p) => (
                    <ConnectionCard
                      key={p.id}
                      id={p.id}
                      name={p.display_name || "Member"}
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
                <EmptyState
                  title="No pending requests"
                  description="When someone sends you a connection request, it'll appear here."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pendingRequests.map((r) => (
                    <ConnectionCard
                      key={r.id}
                      id={r.id}
                      name={r.requester?.display_name || "Member"}
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
              suggestions.length === 0 ? (
                <EmptyState
                  icon={<Users size={28} />}
                  title="No suggestions right now"
                  description="We'll suggest people based on your profile and activity."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.map((p) => (
                    <ConnectionCard
                      key={p.id}
                      id={p.id}
                      name={p.display_name || "Member"}
                      headline={p.headline ?? undefined}
                      avatarUrl={p.avatar_url ?? undefined}
                      mutualConnections={p.mutual_connections}
                      onConnect={connect}
                    />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
