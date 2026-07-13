"use client";

import { useState } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

const SUGGESTION_TYPES = [
  { value: "missing_opportunity", label: "Missing Opportunity" },
  { value: "broken_link", label: "Broken Link Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "general", label: "General Feedback" },
];

export default function ContactPage() {
  const [type, setType] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/api/contact", {
        type: type || null,
        url: url || null,
        notes: notes || null,
        contact_email: email || null,
      });

      setSubmitted(true);
      toast.success("Message sent! We'll get back to you.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <CheckCircle className="w-16 h-16 text-[#00E5FF] mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-white mb-2">Thank You!</h1>
        <p className="text-[#94A3B8] text-sm">
          Your suggestion has been submitted. We review all feedback and will get back to you if needed.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl font-bold text-white mb-2">Contact & Suggestions</h1>
      <p className="text-[#94A3B8] text-sm mb-8">
        Found a missing opportunity? Want to suggest a new feature? Let us know.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-white mb-1.5">
            Type <span className="text-[#00E5FF]">*</span>
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            className="w-full bg-[#1A2438] border border-[#1F2937] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan/50"
          >
            <option value="">Select a type...</option>
            {SUGGESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-white mb-1.5">
            URL (optional)
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/opportunity"
            className="w-full bg-[#1A2438] border border-[#1F2937] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#94A3B8]/50 focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan/50"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-white mb-1.5">
            Notes <span className="text-[#00E5FF]">*</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
            rows={4}
            placeholder="Describe your suggestion, issue, or feedback..."
            className="w-full bg-[#1A2438] border border-[#1F2937] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#94A3B8]/50 focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan/50 resize-y"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white mb-1.5">
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-[#1A2438] border border-[#1F2937] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#94A3B8]/50 focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan/50"
          />
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-[#00E5FF] text-[#0B1120] font-semibold rounded-lg px-6 py-2.5 text-sm hover:bg-[#00E5FF]/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {loading ? "Submitting..." : "Submit Suggestion"}
        </button>
      </form>
    </div>
  );
}
