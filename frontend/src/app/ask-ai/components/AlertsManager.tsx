import React, { useState, useEffect } from "react";
import { Bell, Plus, Trash2, CheckCircle2, ShieldCheck, Sparkles, Search, Mail, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { INSTITUTIONAL_SOURCES } from "@/lib/sources/source-registry";
import { OpportunityCard } from "./OpportunityCard";

export interface OpportunityAlert {
  id: string;
  name: string;
  role: string;
  domain: string;
  organization: string;
  frequency: "daily" | "weekly";
  isActive: boolean;
  createdAt: string;
}

export function AlertsManager() {
  const [alerts, setAlerts] = useState<OpportunityAlert[]>([
    {
      id: "alert-1",
      name: "DRDO & ISRO Electronics JRF Positions",
      role: "JRF (Junior Research Fellow)",
      domain: "VLSI / Semiconductor",
      organization: "DRDO",
      frequency: "daily",
      isActive: true,
      createdAt: new Date().toLocaleDateString(),
    },
    {
      id: "alert-2",
      name: "IITs Microelectronics & ASIC Research",
      role: "All Research Positions",
      domain: "Semiconductor Technology",
      organization: "IIT Delhi",
      frequency: "daily",
      isActive: true,
      createdAt: new Date().toLocaleDateString(),
    },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [alertName, setAlertName] = useState("");
  const [alertRole, setAlertRole] = useState("JRF");
  const [alertDomain, setAlertDomain] = useState("VLSI & Digital Design");
  const [alertOrg, setAlertOrg] = useState("DRDO");
  const [alertFreq, setAlertFreq] = useState<"daily" | "weekly">("daily");

  // Email subscription state
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  // Live scanner state for active alert
  const [scanningAlertId, setScanningAlertId] = useState<string | null>(null);
  const [matchedOpportunities, setMatchedOpportunities] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bdw_opportunity_alerts_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setAlerts(parsed);
      }
    } catch {}
  }, []);

  const saveAlerts = (newAlerts: OpportunityAlert[]) => {
    setAlerts(newAlerts);
    try {
      localStorage.setItem("bdw_opportunity_alerts_v1", JSON.stringify(newAlerts));
    } catch {}
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertName.trim()) {
      toast.error("Please enter a name for your alert.");
      return;
    }

    const newAlert: OpportunityAlert = {
      id: `alert-${Date.now()}`,
      name: alertName.trim(),
      role: alertRole,
      domain: alertDomain,
      organization: alertOrg,
      frequency: alertFreq,
      isActive: true,
      createdAt: new Date().toLocaleDateString(),
    };

    saveAlerts([newAlert, ...alerts]);
    setIsCreating(false);
    setAlertName("");
    toast.success("Opportunity tracker created! Click 'Scan Live Matches' to query the live database.");
  };

  const handleDeleteAlert = (id: string) => {
    saveAlerts(alerts.filter((a) => a.id !== id));
    if (scanningAlertId === id) {
      setMatchedOpportunities([]);
      setScanningAlertId(null);
    }
    toast.success("Alert removed.");
  };

  const handleToggleAlert = (id: string) => {
    saveAlerts(
      alerts.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const handleScanMatches = async (alert: OpportunityAlert) => {
    setScanningAlertId(alert.id);
    setIsScanning(true);
    setMatchedOpportunities([]);

    try {
      const queryParams = new URLSearchParams();
      if (alert.role && alert.role !== "All Research Positions") queryParams.set("role", alert.role);
      if (alert.organization && alert.organization !== "All Premier Institutes") queryParams.set("org", alert.organization);
      queryParams.set("limit", "10");

      const res = await fetch(`/api/opportunities?${queryParams.toString()}`);
      const data = await res.json();
      
      const opps = data.opportunities || [];
      setMatchedOpportunities(opps);
      
      if (opps.length > 0) {
        toast.success(`Found ${opps.length} live matching opportunities for "${alert.name}"!`);
      } else {
        toast.info(`No active vacancies currently match "${alert.name}". Check back soon.`);
      }
    } catch (err) {
      toast.error("Failed to query live database.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubscribeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubscribing(true);
    try {
      const keywords = alerts.map((a) => `${a.organization} ${a.role} ${a.domain}`);
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          keywords,
          categories: ["research", "semiconductor", "jrf"],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubscribed(true);
        toast.success("Subscribed! You will receive weekly verified intelligence digests.");
      } else if (res.status === 409) {
        setSubscribed(true);
        toast.info("This email is already registered for intelligence digests.");
      } else {
        toast.error(data.error || "Subscription failed. Please try again.");
      }
    } catch {
      toast.error("Network error while connecting to digest service.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md text-xs font-bold mb-2">
            <Bell className="w-3.5 h-3.5" />
            Active Surveillance
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Opportunity Intelligence Surveillance
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mt-1 leading-relaxed">
            Configure tailored surveillance trackers to instantly scan verified vacancies across DRDO, ISRO, CSIR, and premier IITs.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Custom Tracker
        </button>
      </div>

      {/* Email Digest Connector */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-white/10 text-blue-200 px-2.5 py-0.5 rounded text-[11px] font-bold">
              <Mail className="w-3 h-3" />
              Email Intelligence Delivery
            </div>
            <h3 className="text-base font-bold text-white">
              Receive Scheduled Intelligence Digests
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connect your email to receive weekly digests of newly indexed and verified research openings matching your active surveillance criteria.
            </p>
          </div>

          <form onSubmit={handleSubscribeEmail} className="w-full md:w-auto flex flex-col sm:flex-row gap-2 shrink-0">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={subscribed}
              className="bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[240px]"
            />
            <button
              type="submit"
              disabled={subscribing || subscribed}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              {subscribing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...
                </>
              ) : subscribed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Subscribed
                </>
              ) : (
                "Subscribe to Digest"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Create Alert Form Modal / Card */}
      {isCreating && (
        <form
          onSubmit={handleCreateAlert}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-in fade-in"
        >
          <h3 className="font-bold text-sm text-slate-900">Define Surveillance Criteria</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Tracker Name</label>
              <input
                type="text"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
                placeholder="e.g. IIT Delhi & DRDO VLSI JRF Tracker"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Role</label>
              <select
                value={alertRole}
                onChange={(e) => setAlertRole(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="JRF">JRF (Junior Research Fellow)</option>
                <option value="SRF">SRF (Senior Research Fellow)</option>
                <option value="PhD">PhD Fellowship</option>
                <option value="Scientist">Scientist / Engineer Position</option>
                <option value="Internship">Research Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Domain / Field</label>
              <select
                value={alertDomain}
                onChange={(e) => setAlertDomain(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="VLSI & Digital Design">VLSI &amp; Digital Design</option>
                <option value="Semiconductor Technology">Semiconductor &amp; Device Physics</option>
                <option value="Embedded & Firmware">Embedded Systems &amp; Firmware</option>
                <option value="RF & Microwave">RF &amp; Microwave Engineering</option>
                <option value="AI Hardware & Neuromorphic">AI Hardware &amp; Neuromorphic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Organization Filter</label>
              <select
                value={alertOrg}
                onChange={(e) => setAlertOrg(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All Premier Institutes">All Premier Institutes</option>
                {INSTITUTIONAL_SOURCES.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Scan Schedule</label>
              <select
                value={alertFreq}
                onChange={(e) => setAlertFreq(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily Real-Time Scan</option>
                <option value="weekly">Weekly Summary Scan</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Save Tracker
            </button>
          </div>
        </form>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Configured Trackers ({alerts.length})
        </p>

        {alerts.map((alert) => {
          const isScanningThis = isScanning && scanningAlertId === alert.id;
          const isViewingMatches = scanningAlertId === alert.id && matchedOpportunities.length > 0;

          return (
            <div
              key={alert.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs transition hover:border-slate-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{alert.name}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                        alert.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {alert.isActive ? "Active" : "Paused"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                    <span>Role: <strong className="text-slate-700">{alert.role}</strong></span>
                    <span>Domain: <strong className="text-slate-700">{alert.domain}</strong></span>
                    <span>Org: <strong className="text-slate-700">{alert.organization}</strong></span>
                    <span>Frequency: <strong className="text-slate-700 capitalize">{alert.frequency}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleScanMatches(alert)}
                    disabled={isScanningThis}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition border border-blue-200/80"
                  >
                    {isScanningThis ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" /> Scan Live Matches
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleAlert(alert.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition ${
                      alert.isActive
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {alert.isActive ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Alert"
                    aria-label="Delete alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Matched Opportunities Grid */}
              {isViewingMatches && (
                <div className="border-t border-slate-100 pt-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Live Matching Database Results ({matchedOpportunities.length}):
                    </span>
                    <button
                      onClick={() => setScanningAlertId(null)}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      Hide Matches
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {matchedOpportunities.map((opp) => (
                      <OpportunityCard key={opp.id} opportunity={opp} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
