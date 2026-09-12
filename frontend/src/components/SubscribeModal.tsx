"use client";

import { useState } from "react";
import { X, Bell, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_OPTIONS = [
  "JRF",
  "SRF",
  "PhD",
  "Govt Job",
  "Private Job",
  "Fellowship",
];

export default function SubscribeModal({ isOpen, onClose }: SubscribeModalProps) {
  const [email, setEmail] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [keywords, setKeywords] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          categories: selectedCategories,
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Subscribed successfully! You'll get alerts for matching opportunities.");
        toast.success("Subscribed! You'll get alerts for matching opportunities.");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
        toast.error(data.error || "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Failed to subscribe. Please try again.");
      toast.error("Failed to subscribe. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 w-full max-w-lg relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors p-1.5 hover:bg-slate-100 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Customize Alert Preferences
            </h2>
            <p className="text-xs text-slate-500 font-normal">Select your target categories &amp; key search terms</p>
          </div>
        </div>

        {status === "success" ? (
          <div className="text-center py-6 bg-blue-50/50 border border-blue-100 rounded-lg">
            <Check className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="text-slate-900 font-semibold text-sm">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white border border-slate-300 text-slate-900 font-normal text-sm rounded-lg px-3.5 py-2.5 shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                Target Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((cat) => {
                  const selected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                        selected
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                Target Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. VLSI, SystemVerilog, IIT Bombay, DRDO, UVM"
                className="w-full bg-white border border-slate-300 text-slate-900 font-normal text-sm rounded-lg px-3.5 py-2.5 shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
              />
            </div>

            {status === "error" && (
              <p className="text-red-600 text-xs font-medium">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors shadow-xs disabled:opacity-50"
            >
              {status === "loading" ? "Saving Preferences..." : "Save & Activate Alerts"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
