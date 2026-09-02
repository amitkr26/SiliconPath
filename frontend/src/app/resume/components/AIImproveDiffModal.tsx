import React, { useState } from "react";
import { Check, X, Sparkles, Edit3 } from "lucide-react";

interface AIImproveDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionType: string;
  originalText: string;
  suggestedText: string;
  onAccept: (text: string) => void;
}

export function AIImproveDiffModal({
  isOpen,
  onClose,
  sectionType,
  originalText,
  suggestedText,
  onAccept,
}: AIImproveDiffModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(suggestedText);

  // Sync editedText when suggestedText updates
  React.useEffect(() => {
    setEditedText(suggestedText);
    setIsEditing(false);
  }, [suggestedText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 capitalize">
                AI Enhanced {sectionType}
              </h2>
              <p className="text-xs text-slate-500">
                Review the AI suggestion and accept, edit, or keep your original text.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            aria-label="Close diff modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diff Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Original Text */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
              Original {sectionType}
            </span>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed">
              {originalText || "<No previous content>"}
            </div>
          </div>

          {/* Suggested / Editable Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Suggestion (Optimized for ATS)
              </span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> {isEditing ? "Done Editing" : "Edit Suggestion"}
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={5}
                className="w-full p-3.5 bg-white border-2 border-blue-500 rounded-xl text-slate-900 text-xs focus:outline-none resize-none leading-relaxed"
              />
            ) : (
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-slate-900 leading-relaxed font-medium">
                {editedText}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition"
          >
            Keep Original
          </button>
          <button
            onClick={() => {
              onAccept(editedText);
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Accept &amp; Insert
          </button>
        </div>
      </div>
    </div>
  );
}
