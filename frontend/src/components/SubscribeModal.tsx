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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-8 w-full max-w-lg relative shadow-brutal-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 transition-colors p-1 bg-slate-100 border-2 border-slate-900 rounded-lg"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-white shadow-brutal-sm">
            <Bell className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Customize Alert Preferences
            </h2>
            <p className="text-xs text-slate-600 font-semibold">Select your target categories &amp; key search terms</p>
          </div>
        </div>

        {status === "success" ? (
          <div className="text-center py-6 bg-blue-50 border-2 border-slate-900 rounded-xl shadow-brutal-sm">
            <Check className="w-12 h-12 text-emerald-600 mx-auto mb-2 stroke-[3]" />
            <p className="text-slate-900 font-extrabold text-sm">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-900 text-xs font-extrabold mb-1.5 uppercase">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white border-2 border-slate-900 text-slate-900 font-bold text-sm rounded-xl px-3.5 py-2.5 shadow-brutal-sm focus:shadow-brutal outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-900 text-xs font-extrabold mb-1.5 uppercase">
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
                        "px-3 py-1.5 rounded-lg text-xs font-extrabold border-2 border-slate-900 transition-all shadow-brutal-sm",
                        selected
                          ? "bg-blue-600 text-white"
                          : "bg-white text-slate-800 hover:bg-slate-50"
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-slate-900 text-xs font-extrabold mb-1.5 uppercase">
                Target Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. VLSI, SystemVerilog, IIT Bombay, DRDO, UVM"
                className="w-full bg-white border-2 border-slate-900 text-slate-900 font-bold text-sm rounded-xl px-3.5 py-2.5 shadow-brutal-sm focus:shadow-brutal outline-none"
              />
            </div>

            {status === "error" && (
              <p className="text-red-600 text-xs font-extrabold">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl py-3 text-sm border-2 border-slate-900 shadow-brutal hover:shadow-brutal-lg transition-all disabled:opacity-50"
            >
              {status === "loading" ? "Saving Preferences..." : "Save &amp; Activate Alerts"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
