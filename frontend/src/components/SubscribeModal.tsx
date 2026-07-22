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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-navy-light border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-cyan" />
          <h2 className="text-xl font-display font-bold text-text-primary">
            Get Email Alerts
          </h2>
        </div>

        {status === "success" ? (
          <div className="text-center py-6">
            <Check className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-text-primary font-medium">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-text-muted text-xs font-medium mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none"
              />
            </div>

            <div>
              <label className="block text-text-muted text-xs font-medium mb-1.5">
                Categories (select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      selectedCategories.includes(cat)
                        ? "bg-cyan/20 border-cyan/50 text-cyan"
                        : "bg-gray-800 border-gray-700 text-text-muted hover:border-gray-600"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-text-muted text-xs font-medium mb-1.5">
                Keywords (comma-separated, e.g. VLSI, spintronics, thin film)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="VLSI, embedded, semiconductor"
                className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none"
              />
            </div>

            {status === "error" && (
              <p className="text-red-400 text-sm">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-cyan text-navy font-semibold rounded-lg py-2.5 text-sm hover:bg-cyan/90 transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
