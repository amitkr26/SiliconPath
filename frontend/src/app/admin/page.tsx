"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import type { Opportunity, Subscriber } from "@/types";
import { CATEGORIES } from "@/lib/utils";
import { NEWS_SOURCES } from "@/lib/scrapers/rss-parser";
import { Loader2, Trash2, Plus, RefreshCw, Check, List, History, ShieldCheck, ShieldAlert, ShieldQuestion, ExternalLink, Edit3, RotateCcw, Sparkles, Users, TrendingUp, Briefcase, Building2, FileText, Megaphone, Activity, BarChart3 } from "lucide-react";
import AIAnalyticsPanel from "@/app/admin/_components/AIAnalyticsPanel";

const ADMIN_TOKEN_KEY = "admin_token";

interface ScrapeLog {
  id: number;
  timestamp: string;
  status: "success" | "error";
  message: string;
  total_fetched?: number;
  inserted?: number;
  skipped?: number;
}

let logIdCounter = 0;

export default function AdminPage() {
  const router = useRouter();
  const { user } = useUser();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"opportunities" | "verification" | "subscribers" | "talent" | "sources" | "logs" | "popular" | "ai">(
    "opportunities"
  );

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);

  const [aiFilling, setAiFilling] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState("");
  const [scrapeLogs, setScrapeLogs] = useState<ScrapeLog[]>([]);
  const [sourcesEnabled, setSourcesEnabled] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NEWS_SOURCES.forEach((s) => (initial[s.name] = true));
    return initial;
  });
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ apply_link: "", official_page_url: "" });
  const [rechecking, setRechecking] = useState<string | null>(null);

  const addLog = useCallback((log: Omit<ScrapeLog, "id" | "timestamp">) => {
    logIdCounter++;
    setScrapeLogs((prev) => [{ id: logIdCounter, timestamp: new Date().toLocaleString(), ...log }, ...prev]);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.authenticated) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        setAuthenticated(true);
      } else {
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("Authentication request failed");
    }
  };

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const data = await api.get<Opportunity[]>("/api/admin/opportunities");
      setOpportunities(data || []);
    } catch {
      setOpportunities([]);
    }
    setLoading(false);
  };

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const data = await api.get<Subscriber[]>("/api/admin/subscribers");
      setSubscribers(data || []);
    } catch {
      setSubscribers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authenticated) { fetchOpportunities(); fetchSubscribers(); }
  }, [authenticated]);

  const handleDeleteOpportunity = async (id: string) => {
    if (!confirm("Delete this opportunity?")) return;
    try {
      await api.delete(`/api/admin/opportunities/${id}`);
      fetchOpportunities();
    } catch {}
  };

  const handleMarkExpired = async (id: string) => {
    try {
      await api.patch(`/api/admin/opportunities/${id}`, { is_active: false });
      fetchOpportunities();
    } catch {}
  };

  const handleVerify = async (id: string) => {
    try {
      await api.patch(`/api/admin/opportunities/${id}`, { verification_status: "verified", verified_at: new Date().toISOString() });
      fetchOpportunities();
    } catch {}
  };

  const handleMarkUnavailable = async (id: string) => {
    try {
      await api.patch(`/api/admin/opportunities/${id}`, { verification_status: "link_unavailable" });
      fetchOpportunities();
    } catch {}
  };

  const handleRecheck = async (id: string) => {
    setRechecking(id);
    try {
      await fetch("/api/admin/recheck-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity_id: id }),
      });
    } catch {}
    setRechecking(null);
    fetchOpportunities();
  };

  const startEditLink = (opp: Opportunity) => {
    setEditingLink(opp.id!);
    setEditForm({ apply_link: opp.apply_link || "", official_page_url: opp.official_page_url || "" });
  };

  const saveEditLink = async (id: string) => {
    try {
      await api.patch(`/api/admin/opportunities/${id}`, { apply_link: editForm.apply_link, official_page_url: editForm.official_page_url });
      setEditingLink(null);
      fetchOpportunities();
    } catch {}
  };

  const handleScrape = async () => {
    setScrapeStatus("Scraping...");
    addLog({ status: "success", message: "Scraping started..." });
    try {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY) || "";
      const res = await fetch("/api/scrape", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      const msg = `Done: ${data.inserted} new, ${data.skipped} duplicates`;
      setScrapeStatus(msg);
      addLog({ status: "success", message: msg, total_fetched: data.total_fetched, inserted: data.inserted, skipped: data.skipped });
    } catch { setScrapeStatus("Scrape failed"); addLog({ status: "error", message: "Scrape failed" }); }
  };

  if (!authenticated) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20">
        <h1 className="font-display text-2xl font-bold text-text-primary text-center mb-6">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" className="w-full bg-surface border border-border text-text-primary text-sm rounded-lg px-4 py-2.5 focus:ring-accent focus:border-accent outline-none" />
          {error && <p className="text-danger text-sm">{error}</p>}
          <button type="submit" className="w-full bg-accent text-bg-primary font-semibold rounded-lg py-2.5 text-sm">Login</button>
        </form>
      </div>
    );
  }

  const verificationQueue = [...opportunities].sort((a, b) => {
    const order: Record<string, number> = { unverified: 0, link_unavailable: 1, expired: 2, verified: 3 };
    return (order[a.verification_status || "unverified"] || 0) - (order[b.verification_status || "unverified"] || 0);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary">Admin Panel</h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/20 text-success rounded-full text-xs font-medium border border-success/30">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            System Normal
          </span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/admin/add-opportunity" className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-accent/20 text-accent border border-accent/30 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:bg-accent/30 transition-colors">
            <Plus className="w-4 h-4" /> Add
          </Link>
          <Link href="/admin/add-news" className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-accent/20 text-accent border border-accent/30 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:bg-accent/30 transition-colors">
            <Plus className="w-4 h-4" /> News
          </Link>
          <Link href="/admin/companies" className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-accent/20 text-accent border border-accent/30 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:bg-accent/30 transition-colors">
            <Building2 className="w-4 h-4" /> Companies
          </Link>
          <Link href="/admin/applications" className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-accent/20 text-accent border border-accent/30 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:bg-accent/30 transition-colors">
            <FileText className="w-4 h-4" /> Applications
          </Link>
          <Link href="/admin/announcements" className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-accent/20 text-accent border border-accent/30 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:bg-accent/30 transition-colors">
            <Megaphone className="w-4 h-4" /> Announce
          </Link>
          <Link href="/admin/performance" className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-accent/20 text-accent border border-accent/30 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:bg-accent/30 transition-colors">
            <Activity className="w-4 h-4" /> Performance
          </Link>
          <Link href="/admin/analytics" className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-accent/20 text-accent border border-accent/30 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:bg-accent/30 transition-colors">
            <BarChart3 className="w-4 h-4" /> Analytics
          </Link>
        </div>
      </div>

      {/* Sidebar + Main layout */}
      <div className="flex gap-8">
        {/* Left sidebar nav (240px) */}
        <aside className="hidden lg:block w-[240px] flex-shrink-0">
          <nav className="space-y-1">
            {(["opportunities", "verification", "subscribers", "talent", "sources", "logs", "popular", "ai"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                  activeTab === tab
                    ? "bg-accent/10 text-accent border-l-2 border-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50"
                }`}
              >
                {tab === "opportunities" ? <List className="w-4 h-4" /> : tab === "verification" ? <ShieldCheck className="w-4 h-4" /> : tab === "subscribers" ? <Users className="w-4 h-4" /> : tab === "talent" ? <Briefcase className="w-4 h-4" /> : tab === "sources" ? <List className="w-4 h-4" /> : tab === "popular" ? <TrendingUp className="w-4 h-4" /> : tab === "ai" ? <Sparkles className="w-4 h-4" /> : <History className="w-4 h-4" />}
                {tab === "opportunities" ? "Opportunities" : tab === "verification" ? "Verification Queue" : tab === "subscribers" ? "Subscribers" : tab === "talent" ? "Talent Pool" : tab === "sources" ? "News Sources" : tab === "popular" ? "Most Popular" : tab === "ai" ? "AI Usage" : "Scrape Logs"}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {/* Stat cards row (only show on opportunities tab) */}
          {activeTab === "opportunities" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-2xl font-bold text-accent font-display">{opportunities.filter(o => o.created_at && new Date(o.created_at) > new Date(Date.now() - 86400000)).length}</p>
                <p className="text-xs text-text-muted mt-1">New Today</p>
              </div>
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-2xl font-bold text-danger font-display">{opportunities.filter(o => o.verification_status === "link_unavailable").length}</p>
                <p className="text-xs text-text-muted mt-1">Broken Links</p>
              </div>
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-2xl font-bold text-warning font-display">{opportunities.filter(o => o.verification_status === "unverified" || !o.verification_status).length}</p>
                <p className="text-xs text-text-muted mt-1">Pending Review</p>
              </div>
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-2xl font-bold text-success font-display">{opportunities.filter(o => o.verification_status === "verified").length}</p>
                <p className="text-xs text-text-muted mt-1">Verified</p>
              </div>
            </div>
          )}

          {/* Mobile tab buttons */}
          <div className="flex lg:hidden gap-2 mb-6 overflow-x-auto pb-2">
            {(["opportunities", "verification", "subscribers", "sources", "logs", "popular", "ai"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeTab === tab ? "bg-accent text-bg-primary" : "bg-surface text-text-secondary border border-border"
                }`}
              >
                {tab === "opportunities" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "opportunities" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-text-primary">All Opportunities ({opportunities.length})</h2>
                <button onClick={handleScrape} className="flex items-center gap-2 text-accent text-sm font-medium hover:underline"><RefreshCw className="w-4 h-4" />Scrape News</button>
              </div>
              {scrapeStatus && <p className="text-text-secondary text-sm mb-4">{scrapeStatus}</p>}
              {loading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-secondary">
                        <th className="text-left py-3 px-2">Title</th>
                        <th className="text-left py-3 px-2">Organization</th>
                        <th className="text-left py-3 px-2">Category</th>
                        <th className="text-left py-3 px-2">Status</th>
                        <th className="text-left py-3 px-2">Deadline</th>
                        <th className="text-left py-3 px-2">Active</th>
                        <th className="text-right py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opportunities.map((opp) => (
                        <tr key={opp.id} className="border-b border-border/50 hover:bg-surface-elevated/50">
                          <td className="py-3 px-2 text-text-primary max-w-[200px] truncate">{opp.title}</td>
                          <td className="py-3 px-2 text-text-secondary">{opp.organization}</td>
                          <td className="py-3 px-2">{opp.category}</td>
                          <td className="py-3 px-2">
                            {opp.verification_status === "verified" ? <span className="text-success text-xs">Verified</span>
                            : opp.verification_status === "link_unavailable" ? <span className="text-warning text-xs">Unavailable</span>
                            : opp.verification_status === "expired" ? <span className="text-danger text-xs">Expired</span>
                            : <span className="text-text-muted text-xs">Unverified</span>}
                          </td>
                          <td className="py-3 px-2 text-text-secondary text-xs">{opp.deadline || "-"}</td>
                          <td className="py-3 px-2">{opp.is_active ? <span className="text-success text-xs">Active</span> : <span className="text-danger text-xs">Expired</span>}</td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {opp.is_active && <button onClick={() => handleMarkExpired(opp.id!)} className="text-xs text-warning hover:underline">Expire</button>}
                              <button onClick={() => router.push(`/admin/edit-opportunity/${opp.id}`)} className="text-accent hover:text-accent/80"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteOpportunity(opp.id!)} className="text-danger hover:text-danger/80"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "verification" && (
            <div>
              <h2 className="font-display text-xl font-bold text-text-primary mb-4">Verification Queue</h2>
              <p className="text-text-secondary text-sm mb-4">Unverified opportunities appear first. Verify each listing after checking the application link.</p>
              {loading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
              ) : (
                <div className="space-y-4">
                  {verificationQueue.map((opp) => (
                    <div key={opp.id} className="bg-surface border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-text-primary font-semibold text-sm">{opp.title}</h3>
                            {opp.verification_status === "verified" ? <ShieldCheck className="w-4 h-4 text-success" />
                            : opp.verification_status === "link_unavailable" ? <ShieldQuestion className="w-4 h-4 text-warning" />
                            : <ShieldAlert className="w-4 h-4 text-text-muted" />}
                          </div>
                          <p className="text-text-secondary text-xs">{opp.organization} &bull; {opp.category}</p>
                          <p className="text-text-secondary text-xs mt-1 truncate max-w-md">
                            Apply: {opp.apply_link || "N/A"}
                            {opp.official_page_url ? ` | Official: ${opp.official_page_url}` : ""}
                          </p>
                          {opp.last_link_checked && (
                            <p className="text-text-secondary text-[10px] mt-1">
                              Last checked: {new Date(opp.last_link_checked).toLocaleString()}
                              {opp.link_check_status ? ` (HTTP ${opp.link_check_status})` : ""}
                            </p>
                          )}
                          {opp.admin_notes && <p className="text-accent/60 text-[10px] mt-1 italic">{opp.admin_notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {editingLink === opp.id ? (
                            <div className="flex flex-col gap-2">
                              <input value={editForm.apply_link} onChange={(e) => setEditForm({ ...editForm, apply_link: e.target.value })} placeholder="Apply link" className="bg-surface-elevated border border-border text-text-primary text-xs rounded px-2 py-1 w-48" />
                              <input value={editForm.official_page_url} onChange={(e) => setEditForm({ ...editForm, official_page_url: e.target.value })} placeholder="Official URL" className="bg-surface-elevated border border-border text-text-primary text-xs rounded px-2 py-1 w-48" />
                              <div className="flex gap-1">
                                <button onClick={() => saveEditLink(opp.id!)} className="text-xs text-success hover:underline">Save</button>
                                <button onClick={() => setEditingLink(null)} className="text-xs text-text-secondary hover:underline">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <button onClick={() => handleVerify(opp.id!)} className="text-xs flex items-center gap-1 bg-success/10 text-success border border-success/30 rounded px-2 py-1 hover:bg-success/20"><Check className="w-3 h-3" /> Verify</button>
                              <button onClick={() => handleMarkUnavailable(opp.id!)} className="text-xs flex items-center gap-1 bg-warning/10 text-warning border border-warning/30 rounded px-2 py-1 hover:bg-warning/20"><ShieldQuestion className="w-3 h-3" /> Unavailable</button>
                              <button onClick={() => startEditLink(opp)} className="text-xs flex items-center gap-1 bg-surface-elevated text-text-secondary border border-border rounded px-2 py-1 hover:text-text-primary"><Edit3 className="w-3 h-3" /> Edit Link</button>
                              <button onClick={() => handleRecheck(opp.id!)} disabled={rechecking === opp.id} className="text-xs flex items-center gap-1 bg-surface-elevated text-text-secondary border border-border rounded px-2 py-1 hover:text-text-primary"><RotateCcw className={`w-3 h-3 ${rechecking === opp.id ? "animate-spin" : ""}`} /> Recheck</button>
                              <button onClick={() => handleDeleteOpportunity(opp.id!)} className="text-xs flex items-center gap-1 bg-danger/10 text-danger border border-danger/30 rounded px-2 py-1 hover:bg-danger/20"><Trash2 className="w-3 h-3" /> Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "sources" && (
            <div>
              <h2 className="font-display text-xl font-bold text-text-primary mb-4">News Sources</h2>
              <p className="text-text-secondary text-sm mb-4">RSS feeds used for news aggregation. Toggle sources on/off.</p>
              <div className="space-y-3">
                {NEWS_SOURCES.map((source) => (
                  <div key={source.name} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-text-primary text-sm font-medium">{source.name}</h3>
                      <p className="text-text-secondary text-xs mt-0.5 break-all">{source.url}</p>
                      <div className="flex gap-1.5 mt-1.5">
                        {(source as any).type === "opportunity" && <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[10px] border border-accent/30">Opportunities</span>}
                        {(!(source as any).type || (source as any).type === "news") && <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[10px] border border-accent/30">News</span>}
                        {source.tags.map((tag) => (<span key={tag} className="px-2 py-0.5 bg-surface-elevated rounded text-text-secondary text-[10px]">{tag}</span>))}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={sourcesEnabled[source.name]} onChange={() => setSourcesEnabled((prev) => ({ ...prev, [source.name]: !prev[source.name] }))} className="sr-only peer" />
                      <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent" />
                      <span className="ms-2 text-xs text-text-secondary">{sourcesEnabled[source.name] ? "Active" : "Disabled"}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "popular" && (
            <div>
              <h2 className="font-display text-xl font-bold text-text-primary mb-4">Most Popular Opportunities</h2>
              {loading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-secondary">
                        <th className="text-left py-3 px-2">Title</th>
                        <th className="text-left py-3 px-2">Organization</th>
                        <th className="text-left py-3 px-2">Clicks</th>
                        <th className="text-left py-3 px-2">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...opportunities].sort((a, b) => (b.apply_clicks || 0) - (a.apply_clicks || 0)).filter((o) => (o.apply_clicks || 0) > 0).map((opp) => (
                        <tr key={opp.id} className="border-b border-border/50 hover:bg-surface-elevated/50">
                          <td className="py-3 px-2 text-text-primary max-w-[200px] truncate">{opp.title}</td>
                          <td className="py-3 px-2 text-text-secondary">{opp.organization}</td>
                          <td className="py-3 px-2"><span className="text-accent font-semibold">{opp.apply_clicks || 0}</span></td>
                          <td className="py-3 px-2">{opp.category}</td>
                        </tr>
                      ))}
                      {opportunities.filter((o) => (o.apply_clicks || 0) > 0).length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-text-secondary">No click data yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "logs" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-text-primary">Scrape Logs</h2>
                {scrapeLogs.length > 0 && <button onClick={() => setScrapeLogs([])} className="text-text-secondary text-xs hover:text-text-primary transition-colors">Clear logs</button>}
              </div>
              {scrapeLogs.length === 0 ? (
                <p className="text-text-secondary text-sm">No scrape logs yet. Run a scrape from the Opportunities tab.</p>
              ) : (
                <div className="space-y-2">
                  {scrapeLogs.map((log) => (
                    <div key={log.id} className={`bg-surface border rounded-lg p-3 ${log.status === "success" ? "border-border" : "border-danger/30"}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary text-xs">{log.timestamp}</span>
                        <span className={`text-xs font-medium ${log.status === "success" ? "text-success" : "text-danger"}`}>{log.status === "success" ? "Success" : "Error"}</span>
                      </div>
                      <p className="text-text-primary text-sm mt-1">{log.message}</p>
                      {log.total_fetched !== undefined && (
                        <div className="flex gap-4 mt-2 text-xs text-text-secondary">
                          <span>Fetched: {log.total_fetched}</span>
                          <span>Inserted: {log.inserted}</span>
                          <span>Skipped: {log.skipped}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "ai" && (
            <div>
              <h2 className="font-display text-xl font-bold text-text-primary mb-4">AI Usage Monitor</h2>
              <AIAnalyticsPanel />
            </div>
          )}

          {activeTab === "talent" && (
            <div className="text-center py-20 text-text-secondary">
              <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h2 className="font-display text-xl font-bold text-text-primary mb-2">Talent Pool</h2>
              <p className="text-sm mb-6">Browse candidates who are open to work</p>
              <Link href="/admin/talent-pool" className="inline-flex items-center gap-2 bg-accent text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-accent-dark transition-colors">
                <Briefcase className="w-4 h-4" /> Open Talent Pool
              </Link>
            </div>
          )}

          {activeTab === "subscribers" && (
            <div>
              <h2 className="font-display text-xl font-bold text-text-primary mb-4">Subscribers ({subscribers.length})</h2>
              {loading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
              ) : subscribers.length === 0 ? (
                <p className="text-text-secondary">No subscribers yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-secondary">
                        <th className="text-left py-3 px-2">Email</th>
                        <th className="text-left py-3 px-2">Categories</th>
                        <th className="text-left py-3 px-2">Keywords</th>
                        <th className="text-left py-3 px-2">Active</th>
                        <th className="text-left py-3 px-2">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="border-b border-border/50 hover:bg-surface-elevated/50">
                          <td className="py-3 px-2 text-text-primary">{sub.email}</td>
                          <td className="py-3 px-2 text-text-secondary text-xs">{sub.categories?.join(", ") || "-"}</td>
                          <td className="py-3 px-2 text-text-secondary text-xs">{sub.keywords?.join(", ") || "-"}</td>
                          <td className="py-3 px-2">{sub.is_active ? <span className="text-success text-xs">Active</span> : <span className="text-danger text-xs">Inactive</span>}</td>
                          <td className="py-3 px-2 text-text-secondary text-xs">{sub.created_at ? new Date(sub.created_at).toLocaleDateString() : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
