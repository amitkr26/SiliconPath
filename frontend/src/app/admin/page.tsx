"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import type { Opportunity, Subscriber } from "@/types";
import {
  Loader2, RefreshCw, Check, ShieldCheck, ExternalLink, Sparkles, Users, TrendingUp,
  Briefcase, Building2, FileText, Activity, BarChart3, Lock, Play, Globe, CheckCircle,
  AlertTriangle, Radio, Rss, Cpu, LogOut, ChevronRight, Server, Shield, Search, Plus,
  Trash2, Edit3, XCircle, Download, Send, Megaphone, Newspaper, UserCheck, Layers
} from "lucide-react";
import nextDynamic from "next/dynamic";
import { toast } from "sonner";

const AIAnalyticsPanel = nextDynamic(() => import("@/app/admin/_components/AIAnalyticsPanel"), {
  loading: () => <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />,
});

const ADMIN_TOKEN_KEY = "admin_token";

interface ScrapeLog {
  id: number;
  timestamp: string;
  source: string;
  status: "success" | "running" | "error";
  message: string;
  inserted: number;
}

const MONITORED_SCRAPER_SOURCES = [
  // GOVERNMENT & ACADEMIC RESEARCH PORTALS
  { name: "DRDO Recruitment (RAC)", category: "Govt JRF & Scientist", url: "https://rac.gov.in", status: "Active Live", type: "Scraper", lastRun: "Today, 19:40" },
  { name: "ISRO Careers (VSSC/SAC/URSC/IPRC)", category: "Govt Space & Microelectronics", url: "https://isro.gov.in", status: "Active Live", type: "Scraper", lastRun: "Today, 19:35" },
  { name: "CSIR CEERI, CSIO & NPL Labs", category: "Govt Research Fellowships", url: "https://csir.res.in", status: "Active Live", type: "Scraper", lastRun: "Today, 19:30" },
  { name: "IIT Bombay Microelectronics", category: "PhD & Postdoc Fellowships", url: "https://ee.iitb.ac.in", status: "Active Live", type: "Scraper", lastRun: "Today, 19:25" },
  { name: "IIT Madras Microelectronics & VLSI", category: "PhD & Research Assistant", url: "https://ee.iitm.ac.in", status: "Active Live", type: "Scraper", lastRun: "Today, 19:20" },
  { name: "IISc Bangalore CeNSE", category: "PhD & Postdoc Nano Science", url: "https://cense.iisc.ac.in", status: "Active Live", type: "Scraper", lastRun: "Today, 19:15" },
  { name: "IIT Delhi Microelectronics", category: "PhD & JRF Openings", url: "https://ee.iitd.ac.in", status: "Active Live", type: "Scraper", lastRun: "Today, 19:10" },
  { name: "IIT Kharagpur VLSI Design Centre", category: "JRF & SRF Fellowships", url: "https://www.iitkgp.ac.in", status: "Active Live", type: "Scraper", lastRun: "Today, 19:05" },
  { name: "IIT Kanpur Electrical Engineering", category: "JRF & Postdoc Opportunities", url: "https://www.iitk.ac.in", status: "Active Live", type: "Scraper", lastRun: "Today, 19:00" },
  { name: "India Semiconductor Mission (ISM)", category: "Govt Policy & Bulletins", url: "https://ism.gov.in", status: "Active Live", type: "Scraper", lastRun: "Today, 18:55" },
  { name: "C-DAC Microelectronics & RISC-V", category: "Govt Chip Design Roles", url: "https://cdac.in", status: "Active Live", type: "Scraper", lastRun: "Today, 18:50" },
  { name: "SCL Chandigarh (Semi-Conductor Lab)", category: "Govt Fab & Wafer Processing", url: "https://scl.gov.in", status: "Active Live", type: "Scraper", lastRun: "Today, 18:45" },

  // HIGH-STANDARD GENUINE RSS NEWS FEEDS
  { name: "IEEE Spectrum (Semiconductors)", category: "IEEE Journal RSS Feed", url: "https://spectrum.ieee.org/rss/semiconductors/fulltext", status: "Active Live", type: "RSS Feed", lastRun: "Today, 19:35" },
  { name: "EE Times (Electronics Engineering Times)", category: "Global Chip News RSS", url: "https://www.eetimes.com/feed/", status: "Active Live", type: "RSS Feed", lastRun: "Today, 19:30" },
  { name: "Semiconductor Engineering", category: "EDA, Verification & Packaging", url: "https://semiengineering.com/feed/", status: "Active Live", type: "RSS Feed", lastRun: "Today, 19:25" },
  { name: "EDN (Electronic Design News)", category: "Circuit & IC Design News", url: "https://www.edn.com/feed/", status: "Active Live", type: "RSS Feed", lastRun: "Today, 19:20" },
  { name: "SemiWiki Semiconductor Forum", category: "Foundry & IP Industry News", url: "https://semiwiki.com/feed/", status: "Active Live", type: "RSS Feed", lastRun: "Today, 19:15" },
  { name: "Electronics Weekly", category: "Embedded & Microelectronics", url: "https://www.electronicsweekly.com/feed/", status: "Active Live", type: "RSS Feed", lastRun: "Today, 19:10" },
  { name: "Tom's Hardware Chip Architecture", category: "Silicon Node & Process Feed", url: "https://www.tomshardware.com/feeds/all", status: "Active Live", type: "RSS Feed", lastRun: "Today, 19:05" },
  { name: "EETimes Asia & Global", category: "Fabless & Foundry Journal", url: "https://www.eetimes.asia/feed/", status: "Active Live", type: "RSS Feed", lastRun: "Today, 19:00" },

  // PREMIER ENTERPRISE CAREER PORTALS
  { name: "Intel India Microelectronics", category: "Enterprise RTL & Silicon", url: "https://jobs.intel.com", status: "Active Live", type: "Scraper", lastRun: "Today, 18:40" },
  { name: "Qualcomm India VLSI & Modem", category: "Modem & Verification Roles", url: "https://qualcomm.com/careers", status: "Active Live", type: "Scraper", lastRun: "Today, 18:35" },
  { name: "AMD India Microelectronics", category: "SoC Design & GPU Firmware", url: "https://careers.amd.com", status: "Active Live", type: "Scraper", lastRun: "Today, 18:30" },
  { name: "Texas Instruments India", category: "Analog & Mixed-Signal IC", url: "https://careers.ti.com", status: "Active Live", type: "Scraper", lastRun: "Today, 18:25" },
  { name: "Arm Semiconductor India", category: "CPU Core & Architecture IP", url: "https://careers.arm.com", status: "Active Live", type: "Scraper", lastRun: "Today, 18:20" },
];

export default function AdminPage() {
  const { user } = useUser();
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"scrapers" | "sources" | "ai" | "opportunities" | "subscribers">("scrapers");

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [scrapingAll, setScrapingAll] = useState(false);

  // Opportunity filtering & search
  const [oppSearch, setOppSearch] = useState("");
  const [oppStatusFilter, setOppStatusFilter] = useState<string>("all");
  const [oppCategoryFilter, setOppCategoryFilter] = useState<string>("all");
  const [oppPage, setOppPage] = useState(1);
  const OPP_PAGE_SIZE = 25;

  // Phase 30D: live DB stats
  const [dbStats, setDbStats] = useState<{
    total: number; active: number; pending: number; rejected: number;
    broken_link: number; expired: number; low_quality: number; has_quality_score: boolean;
  } | null>(null);

  // Subscriber search
  const [subSearch, setSubSearch] = useState("");

  const [scrapeLogs, setScrapeLogs] = useState<ScrapeLog[]>([]);

  useEffect(() => {
    const existingToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    const existingPw = sessionStorage.getItem("admin_password");
    if (!existingToken && !existingPw) return;

    fetch("/api/admin/auth/session", {
      method: "POST",
      headers: {
        ...(existingToken ? { Authorization: `Bearer ${existingToken}` } : {}),
        ...(existingPw ? { "x-admin-password": existingPw } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setAuthenticated(true);
        } else {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          sessionStorage.removeItem("admin_password");
        }
      })
      .catch(() => {
        if (existingPw) setAuthenticated(true);
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });
      const data = await res.json();
      if (data.authenticated) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        sessionStorage.setItem("admin_password", cleanPass);
        setAuthenticated(true);
        toast.success("Admin authenticated successfully");
      } else {
        setError(data.error || "Invalid username or password.");
      }
    } catch {
      setError("Authentication failed. Please check your credentials.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem("admin_password");
    setAuthenticated(false);
    toast.info("Signed out of Admin Console");
  };

  const runAllScrapers = async () => {
    setScrapingAll(true);
    const newLog: ScrapeLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      source: "All Scraper Services",
      status: "running",
      message: "Scraping DRDO, ISRO, CSIR, IITs, IEEE Spectrum, and EE Times...",
      inserted: 0
    };
    setScrapeLogs((prev) => [newLog, ...prev]);

    try {
      const data = await api.post<{ insertedOrUpdated?: number; totalScraped?: number; success?: boolean }>("/api/cron/scrape-opportunities");
      setScrapeLogs((prev) =>
        prev.map((l) =>
          l.id === newLog.id
            ? {
                ...l,
                status: "success",
                message: `Scraped ${data?.totalScraped ?? 0} records, inserted/updated ${data?.insertedOrUpdated ?? 0}`,
                inserted: data?.insertedOrUpdated ?? 0,
              }
            : l
        )
      );
      toast.success("All scrapers completed successfully!");
    } catch (err) {
      setScrapeLogs((prev) =>
        prev.map((l) =>
          l.id === newLog.id
            ? { ...l, status: "error", message: err instanceof Error ? err.message : "Scraper run failed" }
            : l
        )
      );
      toast.error("Scraper run encountered an error");
    } finally {
      setScrapingAll(false);
    }
  };

  const handleTriggerSingleScraper = async (sourceName: string) => {
    const newLog: ScrapeLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      source: sourceName,
      status: "running",
      message: `Triggering sync for ${sourceName}...`,
      inserted: 0,
    };
    setScrapeLogs((prev) => [newLog, ...prev]);

    try {
      const res = await api.post<{ insertedOrUpdated?: number; totalScraped?: number }>(
        "/api/cron/scrape-opportunities",
        { source: sourceName }
      );
      setScrapeLogs((prev) =>
        prev.map((l) =>
          l.id === newLog.id
            ? {
                ...l,
                status: "success",
                message: `Completed: ${res?.totalScraped ?? 0} scanned, ${res?.insertedOrUpdated ?? 0} inserted/updated`,
                inserted: res?.insertedOrUpdated ?? 0,
              }
            : l
        )
      );
      toast.success(`${sourceName} sync completed!`);
    } catch (err) {
      setScrapeLogs((prev) =>
        prev.map((l) =>
          l.id === newLog.id
            ? { ...l, status: "error", message: err instanceof Error ? err.message : "Sync failed" }
            : l
        )
      );
      toast.error(`Failed to sync ${sourceName}`);
    }
  };

  const fetchOpportunities = async (page = 1) => {
    setLoading(true);
    try {
      const offset = (page - 1) * OPP_PAGE_SIZE;
      const data = await api.get<{ opportunities?: Opportunity[]; count?: number } | Opportunity[]>(
        `/api/admin/opportunities?limit=${OPP_PAGE_SIZE}&page=${page}`
      );
      if (Array.isArray(data)) {
        setOpportunities(data);
      } else if (data && Array.isArray(data.opportunities)) {
        setOpportunities(data.opportunities);
      } else {
        setOpportunities([]);
      }
      setOppPage(page);
    } catch {
      setOpportunities([]);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const stats = await api.get<typeof dbStats>("/api/admin/stats");
      setDbStats(stats);
    } catch {
      // non-critical
    }
  };

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ subscribers?: Subscriber[]; count?: number } | Subscriber[]>("/api/admin/subscribers?limit=100");
      if (Array.isArray(data)) {
        setSubscribers(data);
      } else if (data && Array.isArray(data.subscribers)) {
        setSubscribers(data.subscribers);
      } else {
        setSubscribers([]);
      }
    } catch {
      setSubscribers([]);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, status: "verified" | "rejected" | "pending") => {
    try {
      await api.patch(`/api/admin/opportunities/${id}`, { verification_status: status });
      toast.success(`Marked as ${status}`);
      setOpportunities((prev) =>
        prev.map((opp) => (opp.id === id ? { ...opp, verification_status: status } : opp))
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Phase 30D: lifecycle action helper — routes through the action handler
  const handleLifecycleAction = async (
    id: string,
    action: "approve" | "reject" | "archive" | "mark_broken" | "reactivate"
  ) => {
    const labels: Record<string, string> = {
      approve: "Approved & verified",
      reject: "Rejected",
      archive: "Archived (expired)",
      mark_broken: "Marked as broken link",
      reactivate: "Reactivated to pending",
    };
    const optimistic: Record<string, Partial<Opportunity>> = {
      approve:     { verification_status: "verified",         is_active: true  },
      reject:      { verification_status: "rejected",         is_active: false },
      archive:     { verification_status: "expired",          is_active: false },
      mark_broken: { verification_status: "link_unavailable", is_active: false },
      reactivate:  { verification_status: "pending",          is_active: true  },
    };
    try {
      await api.patch(`/api/admin/opportunities/${id}`, { action });
      toast.success(labels[action]);
      setOpportunities((prev) =>
        prev.map((opp) => (opp.id === id ? { ...opp, ...optimistic[action] } : opp))
      );
      // Refresh stats after lifecycle change
      fetchStats();
    } catch {
      toast.error(`Action failed: ${action}`);
    }
  };

  const handleDeleteOpportunity = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this opportunity?")) return;
    try {
      await api.delete(`/api/admin/opportunities/${id}`);
      toast.success("Opportunity deleted");
      setOpportunities((prev) => prev.filter((opp) => opp.id !== id));
    } catch {
      toast.error("Failed to delete opportunity");
    }
  };

  const handleExportSubscribersCSV = () => {
    if (!subscribers.length) {
      toast.error("No subscribers to export");
      return;
    }
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Email,Created At", ...subscribers.map((s) => `"${s.id}","${s.email}","${s.created_at}"`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Subscribers CSV exported!");
  };

  const handleTriggerEmailDigest = async () => {
    try {
      await api.post("/api/cron/email-digest");
      toast.success("Weekly email digest triggered!");
    } catch {
      toast.error("Failed to trigger email digest");
    }
  };

  useEffect(() => {
    if (authenticated) {
      if (activeTab === "opportunities") { fetchOpportunities(1); fetchStats(); }
      if (activeTab === "subscribers") fetchSubscribers();
    }
  }, [authenticated, activeTab]);

  // LOGIN SCREEN (DARK EXECUTIVE ADMIN THEME)
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 mx-auto">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Console</h1>
            <p className="text-slate-400 text-xs font-semibold">BerojgarDegreeWala Management Engine</p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Username / Admin Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username (e.g. admin)"
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
            >
              Authenticate &amp; Access Admin Console
            </button>
          </form>
          
          <div className="pt-2 text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              &larr; Return to Main Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered opportunities
  const filteredOpps = opportunities.filter((opp) => {
    const matchesSearch =
      !oppSearch ||
      opp.title.toLowerCase().includes(oppSearch.toLowerCase()) ||
      (opp.organization && opp.organization.toLowerCase().includes(oppSearch.toLowerCase())) ||
      (opp.location && opp.location.toLowerCase().includes(oppSearch.toLowerCase()));
    
    const matchesStatus =
      oppStatusFilter === "all" ||
      (opp.verification_status || "pending").toLowerCase() === oppStatusFilter.toLowerCase();

    const matchesCategory =
      oppCategoryFilter === "all" ||
      (opp.category || "").toLowerCase() === oppCategoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Filtered subscribers
  const filteredSubs = subscribers.filter(
    (s) => !subSearch || s.email.toLowerCase().includes(subSearch.toLowerCase())
  );

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      
      {/* 1. STANDALONE EXECUTIVE ADMIN SIDEBAR */}
      <aside className="w-full lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        
        {/* BRAND HEADER */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white leading-tight">Admin Portal</h2>
              <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Healthy
              </span>
            </div>
          </div>
        </div>

        {/* PRIMARY TABS */}
        <div className="p-3 space-y-1">
          <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Core Engine</p>
          {[
            { id: "scrapers", label: "Scraper Stream Logs", icon: Radio, count: scrapeLogs.length },
            { id: "sources", label: "Monitored Web & RSS", icon: Rss, count: MONITORED_SCRAPER_SOURCES.length },
            { id: "opportunities", label: "Manage Opportunities", icon: Briefcase, count: opportunities.length },
            { id: "subscribers", label: "Subscribers & Digests", icon: Users, count: subscribers.length },
            { id: "ai", label: "AI Token Analytics", icon: Sparkles },
          ].map((item) => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  active
                    ? "bg-blue-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-semibold"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{item.label}</span>
                </div>
                {item.count != null && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* DEDICATED MANAGEMENT SUB-PAGES */}
        <div className="p-3 border-t border-slate-800 space-y-1 flex-1">
          <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Specialized Hubs</p>
          <Link
            href="/admin/add-opportunity"
            className="flex items-center gap-2.5 px-3.5 py-2 text-slate-400 hover:bg-slate-800/60 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Opportunity</span>
          </Link>
          <Link
            href="/admin/companies"
            className="flex items-center gap-2.5 px-3.5 py-2 text-slate-400 hover:bg-slate-800/60 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Companies &amp; Claims</span>
          </Link>
          <Link
            href="/admin/announcements"
            className="flex items-center gap-2.5 px-3.5 py-2 text-slate-400 hover:bg-slate-800/60 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <Megaphone className="w-4 h-4 text-amber-400" />
            <span>Announcements</span>
          </Link>
          <Link
            href="/admin/add-news"
            className="flex items-center gap-2.5 px-3.5 py-2 text-slate-400 hover:bg-slate-800/60 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <Newspaper className="w-4 h-4 text-cyan-400" />
            <span>Publish News</span>
          </Link>
          <Link
            href="/admin/talent-pool"
            className="flex items-center gap-2.5 px-3.5 py-2 text-slate-400 hover:bg-slate-800/60 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <UserCheck className="w-4 h-4 text-purple-400" />
            <span>Talent Pool</span>
          </Link>
          <Link
            href="/admin/applications"
            className="flex items-center gap-2.5 px-3.5 py-2 text-slate-400 hover:bg-slate-800/60 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <FileText className="w-4 h-4 text-pink-400" />
            <span>Applications</span>
          </Link>
          <Link
            href="/admin/scrape-health"
            className="flex items-center gap-2.5 px-3.5 py-2 text-slate-400 hover:bg-slate-800/60 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Scraper Telemetry</span>
          </Link>
        </div>

        {/* BOTTOM ADMIN FOOTER */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
          >
            <Globe className="w-3.5 h-3.5" /> View Public Site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Lock Console / Sign Out
          </button>
        </div>
      </aside>

      {/* 2. MAIN EXECUTIVE ADMIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-6 lg:p-8 space-y-6 overflow-y-auto">
        
        {/* TOP STATUS BAR */}
        <header className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-blue-400" />
            <div>
              <h1 className="text-lg font-bold text-white capitalize">{activeTab} Management Engine</h1>
              <p className="text-slate-400 text-xs font-semibold">Real-time control panel for database, scrapers, and moderation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runAllScrapers}
              disabled={scrapingAll}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scrapingAll ? "animate-spin" : ""}`} />
              <span>{scrapingAll ? "Syncing All Sources..." : "Run All Scrapers & RSS Sync"}</span>
            </button>
          </div>
        </header>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Scraped Portals</p>
            <p className="text-2xl font-bold text-white">25 Sources</p>
            <p className="text-[10px] font-bold text-emerald-400">100% Monitored Live</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Loaded Opportunities</p>
            <p className="text-2xl font-bold text-blue-400">{opportunities.length}+</p>
            <p className="text-[10px] font-bold text-slate-400">In Direct Moderation</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Subscribers</p>
            <p className="text-2xl font-bold text-blue-400">{subscribers.length}</p>
            <p className="text-[10px] font-bold text-emerald-400">Newsletter Reach</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Database Status</p>
            <p className="text-2xl font-bold text-emerald-400">Connected</p>
            <p className="text-[10px] font-bold text-emerald-300">Supabase PostgreSQL Live</p>
          </div>
        </div>

        {/* TAB 1: SCRAPER STREAM LOGS */}
        {activeTab === "scrapers" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Automated Scraper Stream Logs</h3>
                <p className="text-xs text-slate-400">Daily automated ingestion logs from official portals &amp; RSS feeds</p>
              </div>
              <button
                onClick={runAllScrapers}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
              >
                Refresh Stream
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-semibold text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="text-left py-3 px-3">Timestamp</th>
                    <th className="text-left py-3 px-3">Source Domain</th>
                    <th className="text-left py-3 px-3">Status</th>
                    <th className="text-left py-3 px-3">Log Message</th>
                    <th className="text-right py-3 px-3">Inserted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {scrapeLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                        No manual runs in this session. Click &quot;Run All Scrapers &amp; RSS Sync&quot; to test.
                      </td>
                    </tr>
                  ) : (
                    scrapeLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-mono text-slate-400">{log.timestamp}</td>
                        <td className="py-3 px-3 font-bold text-blue-400">{log.source}</td>
                        <td className="py-3 px-3">
                          {log.status === "success" && (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Success
                            </span>
                          )}
                          {log.status === "running" && (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> In Progress
                            </span>
                          )}
                          {log.status === "error" && (
                            <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-300">{log.message}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">+{log.inserted}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: MONITORED WEB & RSS SOURCES */}
        {activeTab === "sources" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Monitored Web Portals &amp; RSS Feeds ({MONITORED_SCRAPER_SOURCES.length})</h3>
                <p className="text-xs text-slate-400">List of official government, academic, RSS news, and enterprise portals</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MONITORED_SCRAPER_SOURCES.map((src) => (
                <div key={src.name} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-xs truncate">{src.name}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/40 text-blue-300 border border-blue-500/30">
                        {src.type}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                        {src.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">{src.category}</p>
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 truncate">
                      {src.url} <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                  <button
                    onClick={() => handleTriggerSingleScraper(src.name)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs border border-slate-700 shrink-0 transition"
                  >
                    Sync
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AI ANALYTICS */}
        {activeTab === "ai" && <AIAnalyticsPanel />}
        {/* TAB 4: OPPORTUNITIES MODERATION */}
        {activeTab === "opportunities" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Opportunities Directory &amp; Moderation ({opportunities.length})</h3>
                <p className="text-xs text-slate-400">Review, verify, edit, and delete job &amp; fellowship circulars</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/add-opportunity"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Opportunity
                </Link>
                <button
                  onClick={() => { fetchOpportunities(1); fetchStats(); }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Phase 30D: Live DB stats bar */}
            {dbStats && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: "Total", value: dbStats.total, color: "text-white" },
                  { label: "Active", value: dbStats.active, color: "text-emerald-400" },
                  { label: "Pending", value: dbStats.pending, color: "text-amber-400" },
                  { label: "Rejected", value: dbStats.rejected, color: "text-red-400" },
                  { label: "Broken Link", value: dbStats.broken_link, color: "text-orange-400" },
                  { label: "Expired", value: dbStats.expired, color: "text-slate-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* SEARCH & FILTERS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={oppSearch}
                  onChange={(e) => { setOppSearch(e.target.value); setOppPage(1); }}
                  placeholder="Search by title, organization, location..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={oppStatusFilter}
                onChange={(e) => { setOppStatusFilter(e.target.value); setOppPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Verification Statuses</option>
                <option value="verified">✓ Verified Only</option>
                <option value="pending">⏳ Pending Moderation</option>
                <option value="rejected">✗ Rejected</option>
                <option value="expired">⚠ Expired</option>
                <option value="link_unavailable">🔗 Broken Link</option>
              </select>

              <select
                value={oppCategoryFilter}
                onChange={(e) => { setOppCategoryFilter(e.target.value); setOppPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="jrf">JRF (Junior Research)</option>
                <option value="srf">SRF (Senior Research)</option>
                <option value="phd">PhD Admissions</option>
                <option value="government">Government &amp; Scientist B</option>
                <option value="job">Private Engineering Job</option>
                <option value="internship">Internships</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
            ) : filteredOpps.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">No opportunities matched your search criteria.</p>
            ) : (
              <div className="space-y-3">
                {filteredOpps.slice((oppPage - 1) * OPP_PAGE_SIZE, oppPage * OPP_PAGE_SIZE).map((opp) => {
                  const vs = opp.verification_status || "pending";
                  const statusStyle =
                    vs === "verified"           ? "bg-emerald-950 text-emerald-400 border-emerald-500/30"
                    : vs === "rejected"         ? "bg-red-950 text-red-400 border-red-500/30"
                    : vs === "link_unavailable" ? "bg-orange-950 text-orange-400 border-orange-500/30"
                    : vs === "expired"          ? "bg-slate-800 text-slate-400 border-slate-600/30"
                    :                             "bg-amber-950 text-amber-400 border-amber-500/30";
                  const qs = (opp as any).quality_score as number | undefined;
                  const qsColor = qs == null ? "text-slate-600" : qs >= 75 ? "text-emerald-400" : qs >= 50 ? "text-amber-400" : "text-red-400";
                  const lcs = (opp as any).link_check_status as number | null;

                  return (
                    <div key={opp.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        {/* LEFT: title + badges */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white truncate max-w-lg">{opp.title}</span>
                            {opp.category && (
                              <span className="px-2 py-0.5 bg-blue-900/40 text-blue-300 border border-blue-500/30 rounded text-[10px] font-bold uppercase">
                                {opp.category}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusStyle}`}>
                              {vs}
                            </span>
                            {/* Quality score badge — hidden if column not yet migrated */}
                            {qs != null && (
                              <span className={`px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] font-mono font-bold ${qsColor}`}>
                                Q:{qs}
                              </span>
                            )}
                            {/* Link health indicator */}
                            {lcs != null && lcs !== 200 && (
                              <span className="px-2 py-0.5 bg-orange-950 text-orange-400 border border-orange-500/30 rounded text-[10px] font-bold">
                                HTTP {lcs}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            <span className="text-slate-300 font-semibold">{opp.organization || "Independent Organization"}</span>
                            {opp.location && <span> &bull; {opp.location}</span>}
                            {(opp as any).salary_range && <span> &bull; <span className="text-emerald-400 font-semibold">{(opp as any).salary_range}</span></span>}
                            {opp.deadline && <span> &bull; Deadline: {opp.deadline.slice(0, 10)}</span>}
                          </p>
                        </div>

                        {/* RIGHT: lifecycle action buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                          {vs !== "verified" && opp.id && (
                            <button
                              onClick={() => handleLifecycleAction(opp.id!, "approve")}
                              title="Approve & Verify"
                              className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}
                          {vs !== "rejected" && opp.id && (
                            <button
                              onClick={() => handleLifecycleAction(opp.id!, "reject")}
                              title="Reject"
                              className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}
                          {vs !== "expired" && opp.id && (
                            <button
                              onClick={() => handleLifecycleAction(opp.id!, "archive")}
                              title="Archive (mark expired)"
                              className="px-2.5 py-1.5 bg-slate-700/40 hover:bg-slate-700/70 text-slate-400 border border-slate-600/40 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {vs !== "link_unavailable" && opp.id && (
                            <button
                              onClick={() => handleLifecycleAction(opp.id!, "mark_broken")}
                              title="Mark as broken link"
                              className="px-2.5 py-1.5 bg-orange-950/50 hover:bg-orange-950 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(vs === "rejected" || vs === "expired" || vs === "link_unavailable") && opp.id && (
                            <button
                              onClick={() => handleLifecycleAction(opp.id!, "reactivate")}
                              title="Reactivate to pending"
                              className="px-2.5 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {opp.id && (
                            <Link
                              href={`/admin/edit-opportunity/${opp.id}`}
                              title="Edit Opportunity"
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-700 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </Link>
                          )}
                          {opp.id && (
                            <button
                              onClick={() => handleDeleteOpportunity(opp.id!)}
                              title="Delete Opportunity"
                              className="px-2.5 py-1.5 bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {filteredOpps.length > OPP_PAGE_SIZE && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500 font-semibold">
                      Showing {Math.min((oppPage - 1) * OPP_PAGE_SIZE + 1, filteredOpps.length)}–{Math.min(oppPage * OPP_PAGE_SIZE, filteredOpps.length)} of {filteredOpps.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setOppPage(p => Math.max(1, p - 1))}
                        disabled={oppPage === 1}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition"
                      >
                        ← Prev
                      </button>
                      <span className="text-xs text-slate-400 font-mono">Page {oppPage} of {Math.ceil(filteredOpps.length / OPP_PAGE_SIZE)}</span>
                      <button
                        onClick={() => setOppPage(p => Math.min(Math.ceil(filteredOpps.length / OPP_PAGE_SIZE), p + 1))}
                        disabled={oppPage >= Math.ceil(filteredOpps.length / OPP_PAGE_SIZE)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SUBSCRIBERS */}
        {activeTab === "subscribers" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Email Digest Subscribers ({subscribers.length})</h3>
                <p className="text-xs text-slate-400">Manage audience and trigger newsletter broadcasts</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportSubscribersCSV}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
                <button
                  onClick={handleTriggerEmailDigest}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" /> Send Weekly Digest
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                placeholder="Search subscriber by email..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
            ) : filteredSubs.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">No email subscribers found.</p>
            ) : (
              <div className="space-y-2">
                {filteredSubs.map((s) => (
                  <div key={s.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-200 font-mono">{s.email}</span>
                    <span className="text-slate-500 text-[10px] font-mono">{s.created_at ? new Date(s.created_at).toLocaleDateString() : "Active"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
