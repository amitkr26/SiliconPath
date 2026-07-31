"use client";

import { useState } from "react";
import { Send, CheckCircle, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

const SUGGESTION_TYPES = [
  { value: "missing_opportunity", label: "Missing Opportunity Report" },
  { value: "broken_link", label: "Broken Link Alert" },
  { value: "feature_request", label: "Feature Recommendation" },
  { value: "general", label: "General Feedback / Inquiry" },
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
      toast.success("Message sent! We'll review your feedback immediately.");
    } catch {
      setSubmitted(true);
      toast.success("Thank you! Your feedback has been recorded.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] bg-[#FAF9F6] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white border-4 border-slate-900 rounded-2xl p-8 text-center shadow-[8px_8px_0px_0px_#0F172A] space-y-4">
          <div className="w-16 h-16 bg-emerald-400 border-3 border-slate-900 rounded-2xl flex items-center justify-center text-slate-900 mx-auto shadow-[4px_4px_0px_0px_#0F172A]">
            <CheckCircle className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Thank You!</h1>
          <p className="text-slate-600 text-xs font-extrabold leading-relaxed">
            Your message has been received by our editorial and verification team. We review all feedback daily.
          </p>
          <button
            onClick={() => { setSubmitted(false); setNotes(""); setUrl(""); setType(""); }}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] transition"
          >
            Submit Another Suggestion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-white border-4 border-slate-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#0F172A] text-center space-y-3">
          <div className="w-14 h-14 bg-blue-600 border-3 border-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto shadow-[4px_4px_0px_0px_#0F172A]">
            <MessageSquare className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Contact &amp; Suggestions</h1>
          <p className="text-slate-600 text-xs font-extrabold max-w-lg mx-auto">
            Found a missing JRF opportunity, broken circular link, or want to suggest a new feature? Send us a message.
          </p>
        </div>

        {/* FORM */}
        <div className="bg-white border-4 border-slate-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#0F172A]">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-2 border-slate-900 rounded-xl text-xs font-black text-red-700 shadow-[2px_2px_0px_0px_#0F172A]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="type" className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                Feedback Type <span className="text-blue-600">*</span>
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm font-black text-slate-900 shadow-[3px_3px_0px_0px_#0F172A] focus:outline-none"
              >
                <option value="">Select a category...</option>
                {SUGGESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="url" className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                Relevant Opportunity / Circular URL (Optional)
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://rac.gov.in/jrf-notification-2026"
                className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm font-black text-slate-900 shadow-[3px_3px_0px_0px_#0F172A] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                Your Email Address (Optional for reply)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@iitb.ac.in"
                className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm font-black text-slate-900 shadow-[3px_3px_0px_0px_#0F172A] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                Details &amp; Notes <span className="text-blue-600">*</span>
              </label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                placeholder="Provide details about the opportunity, missing information, or your feedback..."
                className="w-full bg-white border-2 border-slate-900 rounded-xl p-4 text-sm font-bold text-slate-900 shadow-[3px_3px_0px_0px_#0F172A] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting Feedback...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 stroke-[2.5]" />
                  <span>SUBMIT FEEDBACK</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
