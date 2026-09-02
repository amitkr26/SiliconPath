import React, { useState } from "react";
import { X, Plus, Copy, Trash2, Edit2, Check, FileText } from "lucide-react";
import { ResumeData } from "../types";

export interface SavedResumeMeta {
  id: string;
  name: string;
  templateId: string;
  updatedAt: string;
}

interface MyResumesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  resumes: SavedResumeMeta[];
  activeResumeId: string;
  onSelectResume: (id: string) => void;
  onCreateNew: () => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}

export function MyResumesDrawer({
  isOpen,
  onClose,
  resumes,
  activeResumeId,
  onSelectResume,
  onCreateNew,
  onDuplicate,
  onRename,
  onDelete,
}: MyResumesDrawerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  if (!isOpen) return null;

  const handleStartRename = (r: SavedResumeMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(r.id);
    setEditName(r.name);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editName.trim()) {
      onRename(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-base text-slate-900">My Resumes</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create New CTA */}
        <div className="p-4 border-b border-slate-100">
          <button
            onClick={() => {
              onCreateNew();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Create New Resume Version
          </button>
        </div>

        {/* Resume Versions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Saved Versions ({resumes.length})
          </p>

          {resumes.map((r) => {
            const isActive = r.id === activeResumeId;
            const isEditing = editingId === r.id;

            return (
              <div
                key={r.id}
                onClick={() => {
                  onSelectResume(r.id);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? "border-blue-600 bg-blue-50/40 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleSaveRename(r.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 flex-1"
                    >
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        className="flex-1 text-xs font-bold border border-blue-500 rounded px-2 py-1 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="p-1 text-emerald-600 hover:text-emerald-700"
                        aria-label="Save rename"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        {r.name}
                        {isActive && (
                          <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-semibold">
                            Active
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Updated {r.updatedAt}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleStartRename(r, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                        title="Rename"
                        aria-label="Rename resume"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicate(r.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100"
                        title="Duplicate"
                        aria-label="Duplicate resume"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {resumes.length > 1 && (
                        <button
                          onClick={() => onDelete(r.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                          title="Delete"
                          aria-label="Delete resume"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
