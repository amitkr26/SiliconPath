"use client";

import { useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SubscribeModal from "./SubscribeModal";

export default function SubscribeSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const quickSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, keywords: [], categories: [] }),
      });
      if (res.ok) {
        setStatus("success");
        toast.success("Subscribed! You'll get weekly alerts.");
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

  if (status === "success") {
    return (
      <div className="flex items-center justify-center gap-2 text-green-400">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium">Subscribed! Check your inbox.</span>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={quickSubscribe} className="bg-[#1A2438] border border-[#1F2937] rounded-xl p-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <div className="flex-1 relative">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full bg-[#111827] border border-[#1F2937] text-white text-sm rounded-xl px-4 py-2.5 focus:border-[#00E5FF]/40 outline-none placeholder:text-[#94A3B8]"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-[#00E5FF] text-[#0B1120] font-semibold rounded-xl px-4 py-2.5 text-sm hover:bg-[#00E5FF]/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          {status === "loading" ? "..." : "Subscribe"}
        </button>
      </form>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-[#94A3B8] text-xs mt-3 hover:text-[#00E5FF] transition-colors underline underline-offset-2 decoration-gray-700 hover:decoration-cyan"
      >
        Set preferences (keywords &amp; categories)
      </button>
      <SubscribeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
