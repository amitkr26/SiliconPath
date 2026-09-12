"use client";

import { useState } from "react";
import { Bell, Check, Loader2, Sparkles, ShieldCheck, Zap, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import SubscribeModal from "./SubscribeModal";

export default function SubscribeSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const quickSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, keywords: [], categories: [] }),
      });
      if (res.ok) {
        setStatus("success");
        toast.success("Subscribed! You'll get instant alerts for matching opportunities.");
      } else {
        const data = await res.json();
        toast.error(data.error || "Something went wrong. Try again.");
        setStatus("idle");
      }
    } catch {
      toast.error("Something went wrong. Try again.");
      setStatus("idle");
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 border border-blue-600/30 rounded-xl p-6 sm:p-8 lg:p-10 text-white shadow-sm relative overflow-hidden">
        
        {/* DECORATIVE BACKGROUND ACCENTS */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          {/* HEADER BADGE */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold mb-3 sm:mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>NEVER MISS AN OPPORTUNITY</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
            Subscribe to Opportunity Alerts
          </h2>

          <p className="mt-3 text-sm sm:text-base text-blue-100 max-w-2xl mx-auto font-normal leading-relaxed">
            Get instant email &amp; Telegram alerts for JRF, PhD, DRDO, ISRO, CSIR, and VLSI roles.
          </p>

          {/* BENEFIT BADGES */}
          <div className="my-4 sm:my-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-medium text-blue-100">
              <Zap className="w-3.5 h-3.5 text-amber-300" /> Real-Time Alerts
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-medium text-blue-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Official Sources
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-medium text-blue-100">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-200" /> Custom Keywords
            </div>
          </div>

          {/* FORM AREA */}
          {status === "success" ? (
            <div className="bg-white rounded-lg p-5 sm:p-6 text-slate-900 max-w-md mx-auto shadow-sm flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-slate-900">Subscription Confirmed!</p>
                <p className="text-xs text-slate-600 font-normal">Alerts will be sent to {email}.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto">
              <form onSubmit={quickSubscribe} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 bg-white border border-slate-300 text-slate-900 font-medium text-sm rounded-lg px-4 py-2.5 outline-none placeholder:text-slate-400 transition-all focus:ring-2 focus:ring-white/40"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-all flex items-center justify-center gap-2 shrink-0 border border-blue-400/40 shadow-xs focus:ring-2 focus:ring-white/40"
                >
                  {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Bell className="w-4 h-4 text-white" />
                  )}
                  <span>{status === "loading" ? "Subscribing..." : "Subscribe"}</span>
                </button>
              </form>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-3 sm:mt-4 text-xs font-medium text-blue-200 hover:text-white transition-colors inline-flex items-center gap-1.5 underline underline-offset-4 decoration-blue-300/60 hover:decoration-white focus:outline-none"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Customize Alert Preferences
              </button>
            </div>
          )}

        </div>
      </div>

      <SubscribeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
