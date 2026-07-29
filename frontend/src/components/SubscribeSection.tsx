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
      <div className="bg-blue-600 border-3 border-slate-900 rounded-2xl p-6 sm:p-10 text-white shadow-[6px_6px_0px_0px_#0F172A] relative overflow-hidden">
        
        {/* DECORATIVE BACKGROUND ACCENTS */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          {/* HEADER BADGE */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border-2 border-slate-900 text-slate-900 text-xs font-black mb-4 shadow-[2px_2px_0px_0px_#0F172A]">
            <Sparkles className="w-4 h-4 text-blue-600 stroke-[3]" />
            <span>NEVER MISS A VERIFIED OPPORTUNITY</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Subscribe to Verified Opportunity Alerts
          </h2>

          <p className="mt-4 text-sm sm:text-base text-blue-50 max-w-2xl mx-auto font-semibold leading-relaxed">
            Get instant email &amp; Telegram alerts tailored to your exact profile. Receive official circulars for JRF, PhD, DRDO, ISRO, CSIR, and premier VLSI enterprise roles.
          </p>

          {/* BENEFIT BADGES */}
          <div className="my-6 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-700/60 border border-blue-400/40 rounded-md text-xs font-extrabold text-blue-100">
              <Zap className="w-3.5 h-3.5 text-amber-300 stroke-[2.5]" /> Real-Time Notifications
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-700/60 border border-blue-400/40 rounded-md text-xs font-extrabold text-blue-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 stroke-[2.5]" /> 100% Official Links
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-700/60 border border-blue-400/40 rounded-md text-xs font-extrabold text-blue-100">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-300 stroke-[2.5]" /> Custom Keywords
            </div>
          </div>

          {/* FORM AREA */}
          {status === "success" ? (
            <div className="bg-white border-2 border-slate-900 rounded-xl p-6 text-slate-900 max-w-md mx-auto shadow-[4px_4px_0px_0px_#0F172A] flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 border-2 border-slate-900">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div className="text-left">
                <p className="font-extrabold text-sm text-slate-900">Subscription Confirmed!</p>
                <p className="text-xs text-slate-600 font-semibold">Alerts will be sent directly to {email}.</p>
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
                  placeholder="Enter your email (e.g. you@email.com)"
                  className="flex-1 bg-white border-2 border-slate-900 text-slate-900 font-bold text-sm rounded-xl px-4 py-3 shadow-[3px_3px_0px_0px_#0F172A] focus:shadow-[5px_5px_0px_0px_#0F172A] outline-none placeholder:text-slate-400 transition-all"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-black rounded-xl px-6 py-3 text-sm border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] hover:shadow-[5px_5px_0px_0px_#0F172A] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <Bell className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                  )}
                  <span>{status === "loading" ? "Subscribing..." : "Subscribe Now"}</span>
                </button>
              </form>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-4 text-xs font-extrabold text-blue-100 hover:text-white transition-colors inline-flex items-center gap-1.5 underline underline-offset-4 decoration-blue-300 hover:decoration-white"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Customize Alert Preferences (Target Keywords &amp; Categories)
              </button>
            </div>
          )}

        </div>
      </div>

      <SubscribeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
