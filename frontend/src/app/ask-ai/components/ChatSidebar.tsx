import React, { useState } from "react";
import Link from "next/link";
import {
  Plus, MessageSquare, Trash2, Edit2, Check, X, Search,
  ChevronLeft, ChevronRight, Home, Briefcase
} from "lucide-react";
import { ChatSession } from "../hooks/useChatSessions";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  searchQuery,
  onSearchChange,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSession(id);
    setDeletingId(null);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800">
      {/* Top Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed ? (
          <>
            <button
              onClick={onNewChat}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded-xl transition shadow-sm"
              title="Start New Chat"
            >
              <Plus className="w-4 h-4" /> New Conversation
            </button>
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition ml-2"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full flex flex-col items-center gap-2">
            <button
              onClick={onToggleCollapse}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNewChat}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shadow-sm"
              title="New Chat"
              aria-label="New chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Search (when expanded) */}
      {!isCollapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-slate-800/80 border border-slate-700/80 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 transition"
            />
          </div>
        </div>
      )}

      {/* Conversation Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {!isCollapsed && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
            Recent Chats ({sessions.length})
          </p>
        )}

        {sessions.map((s) => {
          const isActive = s.id === activeSessionId;
          const isEditing = editingId === s.id;
          const isDeleting = deletingId === s.id;

          if (isCollapsed) {
            return (
              <button
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className={`w-full p-2.5 rounded-xl flex items-center justify-center transition ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                title={s.title}
                aria-label={s.title}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            );
          }

          if (isDeleting) {
            return (
              <div
                key={s.id}
                className="p-2 rounded-xl bg-red-950/60 border border-red-800/80 text-xs space-y-1.5"
              >
                <p className="text-red-300 font-medium">Delete this conversation?</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => confirmDelete(s.id, e)}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[11px] font-bold"
                  >
                    Delete
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(null);
                    }}
                    className="text-slate-400 hover:text-white text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          if (isEditing) {
            return (
              <form
                key={s.id}
                onSubmit={(e) => saveRename(s.id, e)}
                className="flex items-center gap-1 p-1 bg-slate-800 rounded-xl border border-blue-500"
              >
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent text-xs text-white px-1.5 py-1 focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                  aria-label="Save name"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelRename}
                  className="p-1 text-slate-400 hover:text-slate-300"
                  aria-label="Cancel rename"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            );
          }

          return (
            <div
              key={s.id}
              onClick={() => {
                onSelectSession(s.id);
                onCloseMobile();
              }}
              className={`group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer text-xs transition-all ${
                isActive
                  ? "bg-slate-800 text-blue-400 font-semibold border border-slate-700"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                <span className="truncate">{s.title}</span>
              </div>

              {/* Action buttons on hover */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                <button
                  onClick={(e) => startRename(s, e)}
                  className="p-1 text-slate-400 hover:text-blue-400 rounded"
                  title="Rename"
                  aria-label="Rename conversation"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingId(s.id);
                  }}
                  className="p-1 text-slate-400 hover:text-red-400 rounded"
                  title="Delete"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Nav Links */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800 space-y-1 text-xs text-slate-400">
          <Link
            href="/"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>SiliconPath Home</span>
          </Link>
          <Link
            href="/opportunities"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Opportunities Feed</span>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] flex flex-col z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
