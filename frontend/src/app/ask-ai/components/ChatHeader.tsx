import React from "react";
import Link from "next/link";
import { Sparkles, Plus, Menu, ArrowLeft } from "lucide-react";

interface ChatHeaderProps {
  onOpenMobileSidebar: () => void;
  onNewChat: () => void;
}

export function ChatHeader({ onOpenMobileSidebar, onNewChat }: ChatHeaderProps) {
  return (
    <header className="h-14 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm px-4 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
          aria-label="Open conversation history"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Branding & Subtitle */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="hidden sm:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition mr-0.5"
            title="Return to Homepage"
            aria-label="Return to Homepage"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-slate-900 leading-tight">
                BerojgarDegreeWala AI
              </h1>
              <span className="hidden sm:inline-flex text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-blue-200/60">
                Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Semiconductor &amp; VLSI Career Specialist
            </p>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-xl transition shadow-sm"
        title="Start a new conversation"
        aria-label="New chat"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">New Chat</span>
      </button>
    </header>
  );
}
