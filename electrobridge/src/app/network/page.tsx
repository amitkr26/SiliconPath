"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, UserPlus, UserCheck, Check, X, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Person {
  id: string;
  display_name?: string | null;
  headline?: string | null;
  current_company?: string | null;
}

interface Request {
  id: string;
  requester_id?: string;
  addressee_id?: string;
  status?: string;
  requester?: Person | null;
  addressee?: Person | null;
}

const TABS = [
  { key: "connections", label: "Connections", icon: Users },
  { key: "received", label: "Requests", icon: UserPlus },
  { key: "suggestions", label: "Suggestions", icon: UserCheck },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function NetworkPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("connections");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [connections, setConnections] = useState<Person[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [suggestions, setSuggestions] = useState<Person[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "connections") {
        const res = await fetch(`/api/network/connections${search ? `?q=${encodeURIComponent(search)}` : ""}`);
        if (res.ok) {
          const data = await res.json();
          setConnections(data.connections || []);
        }
      } else if (tab === "received") {
        const res = await fetch("/api/network/connect");
        if (res.ok) {
          const data = await res.json();
          setRequests(data.requests || []);
        }
      } else if (tab === "suggestions") {
        const res = await fetch("/api/network/suggestions?limit=20");
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [tab, search]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login?redirectTo=/network");
    });
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const connect = async (addresseeId: string) => {
    try {
      const res = await fetch("/api/network/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: addresseeId }),
      });
      if (res.ok) {
        toast.success("Request sent!");
        load();
      } else {
        toast.error("Failed");
      }
    } catch {
      toast.error("Failed");
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
        toast.success(status === "accepted" ? "Connected!" : "Declined");
        load();
      }
    } catch {
      /* ignore */
    }
  };

  const PersonCard = ({ p, action }: { p: Person; action?: React.ReactNode }) => (
    <div className="bg-bg-secondary border border-border rounded-xl p-4 flex flex-col">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-accent/15 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
          {initials(p.display_name)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{p.display_name || "Member"}</p>
          {p.headline && <p className="text-xs text-text-secondary truncate">{p.headline}</p>}
          {p.current_company && <p className="text-xs text-text-muted truncate">{p.current_company}</p>}
        </div>
      </div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-4">My Network</h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-5 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-accent text-accent"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "connections" && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search connections..."
              className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-accent focus:border-accent outline-none"
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-accent" />
          </div>
        ) : (
          <>
            {tab === "connections" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {connections.map((p) => (
                  <PersonCard key={p.id} p={p} />
                ))}
                {connections.length === 0 && (
                  <p className="text-text-secondary text-sm col-span-full text-center py-10">
                    {search ? "No matching connections" : "No connections yet. Grow your network from Suggestions."}
                  </p>
                )}
              </div>
            )}

            {tab === "received" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {requests
                  .filter((r) => r.status === "pending" && r.requester)
                  .map((r) => (
                    <PersonCard
                      key={r.id}
                      p={r.requester as Person}
                      action={
                        <div className="flex gap-2">
                          <button
                            onClick={() => respond(r.id, "accepted")}
                            className="flex-1 inline-flex items-center justify-center gap-1 bg-accent/15 text-accent border border-accent/30 rounded-lg py-1.5 text-xs font-medium hover:bg-accent/25 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => respond(r.id, "rejected")}
                            className="flex-1 inline-flex items-center justify-center gap-1 bg-bg-primary border border-border text-text-secondary rounded-lg py-1.5 text-xs font-medium hover:text-danger transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      }
                    />
                  ))}
                {requests.filter((r) => r.status === "pending" && r.requester).length === 0 && (
                  <p className="text-text-secondary text-sm col-span-full text-center py-10">
                    No pending requests
                  </p>
                )}
              </div>
            )}

            {tab === "suggestions" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((p) => (
                  <PersonCard
                    key={p.id}
                    p={p}
                    action={
                      <button
                        onClick={() => connect(p.id)}
                        className="w-full inline-flex items-center justify-center gap-1 bg-accent/15 text-accent border border-accent/30 rounded-lg py-1.5 text-xs font-medium hover:bg-accent/25 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Connect
                      </button>
                    }
                  />
                ))}
                {suggestions.length === 0 && (
                  <p className="text-text-secondary text-sm col-span-full text-center py-10">
                    No suggestions available
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
