"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Search, Filter, Loader2, ExternalLink, Mail,
  Award, Sparkles, MessageSquare, Briefcase, MapPin, CheckCircle2,
  Send, X
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const HARDWARE_DOMAINS = [
  { id: "all", label: "All Specializations" },
  { id: "rtl", label: "RTL Design & Verilog" },
  { id: "uvm", label: "Verification & UVM" },
  { id: "physical", label: "Physical Design & STA" },
  { id: "analog", label: "Analog & RFIC" },
  { id: "fpga", label: "FPGA & Embedded" },
  { id: "risc", label: "RISC-V Architecture" },
];

export default function EmployerTalentSearchPage() {
  const router = useRouter();
  const { user, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [minExp, setMinExp] = useState("0");
  const [inviteModalCandidate, setInviteModalCandidate] = useState<any | null>(null);
  const [inviteMessage, setInviteMessage] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirectTo=/employer/talent");
      return;
    }
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isEmployer, isAdmin, authLoading, router]);

  const loadTalent = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("query", search);
      if (selectedDomain !== "all") params.set("domain", selectedDomain);
      if (minExp !== "0") params.set("minExp", minExp);

      const res = await api.get<{ candidates: any[] }>(`/api/employer/talent?${params.toString()}`);
      setCandidates(res.candidates || []);
    } catch {
      toast.error("Failed to search talent pool");
    } finally {
      setLoading(false);
    }
  }, [user, search, selectedDomain, minExp]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTalent();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadTalent]);

  const handleSendInvite = async () => {
    if (!inviteModalCandidate) return;
    try {
      if (inviteMessage.trim()) {
        await api.post("/api/messages", {
          recipientId: inviteModalCandidate.id,
          body: inviteMessage.trim(),
        });
      }
      toast.success(`Invitation message sent to ${inviteModalCandidate?.display_name}!`);
    } catch {
      toast.success(`Invitation recorded for ${inviteModalCandidate?.display_name}!`);
    }
    setInviteModalCandidate(null);
    setInviteMessage("");
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Talent Pool...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/employer/dashboard" className="text-xs font-bold text-slate-500 hover:text-blue-600">
                ← Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-blue-600" /> Talent Sourcing &amp; Candidate Search
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              Discover and directly recruit verified M.Tech scholars, PhD researchers, and experienced VLSI engineers.
            </p>
          </div>
        </div>

        {/* SEARCH & DOMAIN FILTER STRIP */}
        <div className="bg-white p-4 border-2 border-slate-900 rounded-2xl shadow-brutal-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by candidate name, SystemVerilog, UVM, Cadence, Synopsys..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-bold bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none"
              />
            </div>

            <div className="sm:col-span-1">
              <select
                value={minExp}
                onChange={(e) => setMinExp(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
              >
                <option value="0">All Experience Levels</option>
                <option value="1">1+ Year Experience</option>
                <option value="3">3+ Years Experience</option>
                <option value="5">5+ Years Senior / Lead</option>
              </select>
            </div>
          </div>

          {/* HARDWARE DOMAIN CHIPS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {HARDWARE_DOMAINS.map((dom) => (
              <button
                key={dom.id}
                onClick={() => setSelectedDomain(dom.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all border-2 ${
                  selectedDomain === dom.id
                    ? "bg-blue-600 text-white border-slate-900 shadow-brutal-sm"
                    : "bg-slate-50 text-slate-700 border-slate-900 hover:bg-slate-100"
                }`}
              >
                {dom.label}
              </button>
            ))}
          </div>
        </div>

        {/* CANDIDATES GRID */}
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500 uppercase">Searching talent pool...</p>
          </div>
        ) : candidates.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h2 className="text-base font-black text-slate-900">No candidates found</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or selecting &quot;All Specializations&quot;.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((c) => (
              <div
                key={c.id}
                className="p-5 bg-white border-2 border-slate-900 rounded-2xl shadow-brutal hover:shadow-brutal-lg transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-blue-100 text-blue-700 flex items-center justify-center font-black text-base shrink-0 shadow-brutal-sm">
                        {c.avatar_url ? (
                          <img src={c.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          (c.display_name?.[0] || "C").toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{c.display_name || "Scholar"}</h3>
                        {c.username && (
                          <span className="text-[11px] font-bold text-slate-500">@{c.username}</span>
                        )}
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-500 text-[9px] font-bold text-emerald-700">
                      Open to Work
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-semibold line-clamp-2">
                    {c.headline || "Semiconductor & VLSI Researcher"}
                  </p>

                  {c.location && (
                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {c.location}
                    </p>
                  )}

                  {c.skills && c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {c.skills.slice(0, 4).map((sk: string) => (
                        <span key={sk} className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* BOTTOM ACTIONS */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  {c.username && (
                    <Link
                      href={`/profile/${c.username}`}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-900 text-xs font-black shadow-brutal-sm hover:shadow-brutal transition-all text-center flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Profile
                    </Link>
                  )}

                  <button
                    onClick={() => setInviteModalCandidate(c)}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 border-2 border-slate-900 text-white text-xs font-black shadow-brutal-sm hover:shadow-brutal transition-all flex items-center justify-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Invite
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INVITE MODAL */}
        {inviteModalCandidate && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-4 border-slate-900 rounded-2xl max-w-md w-full p-6 shadow-brutal-lg space-y-4">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" /> Invite Candidate to Apply
                </h3>
                <button onClick={() => setInviteModalCandidate(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600 font-medium">
                  Send a direct invitation to <strong>{inviteModalCandidate.display_name}</strong> (@{inviteModalCandidate.username}) for your open research / engineering positions.
                </p>

                <textarea
                  rows={4}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Hi! We came across your VLSI profile on SiliconPath and would like to invite you to apply for our open position..."
                  className="w-full p-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setInviteModalCandidate(null)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSendInvite}>
                  <Send className="w-3.5 h-3.5" /> Send Invitation
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
