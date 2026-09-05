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
      <div className="bg-blue-600 border-2 border-slate-900 rounded-2xl p-5 sm:p-8 lg:p-10 text-white shadow-brutal-lg relative overflow-hidden">
        
        {/* DECORATIVE BACKGROUND ACCENTS */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          {/* HEADER BADGE */}
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white border-2 border-slate-900 text-slate-900 text-xs font-black mb-3 sm:mb-4 shadow-brutal-sm">
            <Sparkles className="w-4 h-4 text-blue-600 stroke-[3]" />
            <span>NEVER MISS AN OPPORTUNITY</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Subscribe to Opportunity Alerts
          </h2>

          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-blue-50 max-w-2xl mx-auto font-semibold leading-relaxed">
            Get instant email &amp; Telegram alerts for JRF, PhD, DRDO, ISRO, CSIR, and VLSI roles.
          </p>

          {/* BENEFIT BADGES */}
          <div className="my-4 sm:my-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-blue-700/60 border-2 border-white/20 rounded-full text-[11px] sm:text-xs font-extrabold text-blue-100">
              <Zap className="w-3.5 h-3.5 text-amber-300 stroke-[2.5]" /> Real-Time Alerts
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-blue-700/60 border-2 border-white/20 rounded-full text-[11px] sm:text-xs font-extrabold text-blue-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 stroke-[2.5]" /> Official Sources
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-blue-700/60 border-2 border-white/20 rounded-full text-[11px] sm:text-xs font-extrabold text-blue-100">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-100 stroke-[2.5]" /> Custom Keywords
            </div>
          </div>

          {/* FORM AREA */}
          {status === "success" ? (
            <div className="bg-white border-2 border-slate-900 rounded-xl p-5 sm:p-6 text-slate-900 max-w-md mx-auto shadow-brutal flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 border-2 border-slate-900">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div className="text-left">
                <p className="font-extrabold text-sm text-slate-900">Subscription Confirmed!</p>
                <p className="text-xs text-slate-600 font-semibold">Alerts will be sent to {email}.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto">
              <form onSubmit={quickSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-white border-2 border-slate-900 text-slate-900 font-bold text-sm rounded-xl px-4 py-3 shadow-brutal-sm focus:shadow-brutal outline-none placeholder:text-slate-400 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-black rounded-xl px-6 py-3 text-sm border-2 border-slate-900 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <Bell className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                  )}
                  <span>{status === "loading" ? "Subscribing..." : "Subscribe"}</span>
                </button>
              </form>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-3 sm:mt-4 text-xs font-extrabold text-blue-100 hover:text-white transition-colors inline-flex items-center gap-1.5 underline underline-offset-4 decoration-blue-300 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
