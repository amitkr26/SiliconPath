import React from "react";
import { Check, X, UploadCloud, AlertCircle, FileText, Sparkles } from "lucide-react";
import { ParsedResumeProfile } from "@/lib/resume-text-parser";

interface ImportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedData: ParsedResumeProfile;
  onApplyAll: (data: ParsedResumeProfile) => void;
  onMerge: (data: ParsedResumeProfile) => void;
}

export function ImportReviewModal({
  isOpen,
  onClose,
  parsedData,
  onApplyAll,
  onMerge,
}: ImportReviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                Review Extracted Resume Data
              </h2>
              <p className="text-xs text-slate-500">
                Verify parsed details before applying them to your active resume editor.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            aria-label="Close review modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Extracted Details Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Personal Info */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Personal Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div><span className="text-slate-400">Name:</span> {parsedData.full_name || "—"}</div>
              <div><span className="text-slate-400">Headline:</span> {parsedData.headline || "—"}</div>
              <div><span className="text-slate-400">Email:</span> {parsedData.email || "—"}</div>
              <div><span className="text-slate-400">Phone:</span> {parsedData.phone || "—"}</div>
              <div><span className="text-slate-400">Location:</span> {parsedData.location || "—"}</div>
            </div>
          </div>

          {/* Summary */}
          {parsedData.about && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Profile Summary
              </p>
              <p className="text-slate-700 leading-relaxed">{parsedData.about}</p>
            </div>
          )}

          {/* Education Count & Items */}
          {parsedData.education && parsedData.education.length > 0 && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Education ({parsedData.education.length} detected)
              </p>
              <div className="space-y-1.5">
                {parsedData.education.map((edu, i) => (
                  <div key={i} className="flex justify-between text-slate-700">
                    <span className="font-semibold">{edu.degree} — {edu.institution}</span>
                    <span className="text-slate-500">{edu.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience Count & Items */}
          {parsedData.experience && parsedData.experience.length > 0 && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Experience ({parsedData.experience.length} detected)
              </p>
              <div className="space-y-2">
                {parsedData.experience.map((exp, i) => (
                  <div key={i} className="text-slate-700 border-l-2 border-blue-500 pl-2">
                    <div className="flex justify-between font-semibold">
                      <span>{exp.role} @ {exp.company}</span>
                      <span className="text-slate-500 font-normal">{exp.duration}</span>
                    </div>
                    {exp.description && (
                      <p className="text-slate-600 line-clamp-2 mt-0.5">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {parsedData.skills && parsedData.skills.length > 0 && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Detected Skills ({parsedData.skills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parsedData.skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-800 text-[11px] font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition"
          >
            Discard
          </button>
          <button
            onClick={() => onMerge(parsedData)}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition shadow-sm"
          >
            Merge with Existing
          </button>
          <button
            onClick={() => onApplyAll(parsedData)}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Apply All &amp; Replace
          </button>
        </div>
      </div>
    </div>
  );
}
