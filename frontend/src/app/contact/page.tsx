"use client";

import { useState } from "react";
import { MessageSquare, Send, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const SUGGESTION_TYPES = [
  { value: "missing_opportunity", label: "Missing Opportunity (JRF, SRF, Job, Internship)" },
  { value: "broken_link", label: "Broken Application Link / Circular 404" },
  { value: "incorrect_data", label: "Incorrect Information (Stipend, Deadline, Eligibility)" },
  { value: "feature_request", label: "Feature Suggestion / Improvement" },
  { value: "partnership", label: "Recruiter / Institutional Partnership" },
  { value: "other", label: "Other Feedback" },
];

export default function ContactPage() {
  const [type, setType] = useState("");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !notes.trim()) {
      toast.error("Please fill in the required fields.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post("/api/contact", {
        type,
        url: url.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim(),
      });
      setSubmitted(true);
      toast.success("Message sent! We'll review your feedback immediately.");
    } catch (err: any) {
      const message = err?.body?.error || err?.message || "Network error — please check your connection and try again.";
      setError(message);
      toast.error("Failed to send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] bg-[#FAF9F6] flex items-center justify-center py-16 px-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-400 border-2 border-slate-900 rounded-2xl flex items-center justify-center text-slate-900 mx-auto shadow-brutal-sm">
            <CheckCircle className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Thank You!</h1>
          <p className="text-slate-600 text-xs font-semibold leading-relaxed">
            Your message has been received by our editorial and verification team. We review all feedback daily.
          </p>
          <Button
            onClick={() => { setSubmitted(false); setNotes(""); setUrl(""); setType(""); }}
            className="w-full"
          >
            Submit Another Suggestion
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* HEADER */}
        <Card className="p-8 text-center space-y-3">
          <div className="w-14 h-14 bg-accent border-2 border-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto shadow-brutal-sm">
            <MessageSquare className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Contact &amp; Suggestions</h1>
          <p className="text-slate-600 text-xs font-semibold max-w-lg mx-auto">
            Found a missing JRF opportunity, broken circular link, or want to suggest a new feature? Send us a message.
          </p>
        </Card>

        {/* FORM */}
        <Card className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-2 border-slate-900 rounded-xl text-xs font-black text-red-700 shadow-brutal-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="type" className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                Feedback Type <span className="text-accent">*</span>
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 shadow-brutal-sm focus:outline-none focus:border-accent"
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
                className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 shadow-brutal-sm focus:outline-none focus:border-accent"
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
                className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 shadow-brutal-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                Details &amp; Notes <span className="text-accent">*</span>
              </label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                placeholder="Provide details about the opportunity, missing information, or your feedback..."
                className="w-full bg-white border-2 border-slate-900 rounded-xl p-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 shadow-brutal-sm focus:outline-none focus:border-accent"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-sm"
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
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
