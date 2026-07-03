"use client";

import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: string;
}

export default function ReportIssueModal({ isOpen, onClose, opportunityId }: ReportIssueModalProps) {
  const [reportType, setReportType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await fetch("/api/report-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity_id: opportunityId, report_type: reportType, description }),
      });
      setStatus("success");
      toast.success("Issue reported. We'll look into it.");
      setTimeout(() => { onClose(); setStatus("idle"); setReportType(""); setDescription(""); }, 1500);
    } catch {
      toast.error("Couldn't submit report. Try again.");
      setStatus("idle");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-navy-light border border-gray-700 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-text-primary">Report an Issue</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {status === "success" ? (
          <div className="flex items-center gap-2 text-green-400 py-8 justify-center">
            <Check className="w-5 h-5" />
            <span className="font-medium">Thanks for your report!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-text-muted text-xs font-medium mb-2">What&apos;s the issue?</label>
              <div className="space-y-2">
                {[
                  { value: "broken_link", label: "Link is broken" },
                  { value: "wrong_info", label: "Wrong information" },
                  { value: "expired", label: "Opportunity expired" },
                  { value: "other", label: "Other" },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="report_type"
                      value={opt.value}
                      checked={reportType === opt.value}
                      onChange={(e) => setReportType(e.target.value)}
                      className="accent-cyan"
                    />
                    <span className="text-text-primary text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-text-muted text-xs font-medium mb-1">Additional details (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-cyan focus:border-cyan outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={!reportType || status === "loading"}
              className="w-full bg-cyan text-navy font-semibold rounded-lg py-2.5 text-sm hover:bg-cyan/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit Report
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
