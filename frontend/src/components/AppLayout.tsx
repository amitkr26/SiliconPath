"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AskAIModal from "./AskAIModal";
import { Sparkles } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isChat = pathname === "/chat" || pathname === "/ask-ai";
  const [aiModalOpen, setAiModalOpen] = useState(false);

  if (isAdmin) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">{children}</div>;
  }

  if (isChat) {
    return (
      <div className="flex flex-col min-h-screen h-screen">
        <main className="flex-1 min-h-0">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Floating Ask AI Button */}
      <button
        onClick={() => setAiModalOpen(true)}
        aria-label="Ask AI Assistant"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 sm:gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl border-3 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] sm:shadow-[4px_4px_0px_0px_#0F172A] font-black text-xs sm:text-sm transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] group"
      >
        <Sparkles size={18} className="text-white fill-current stroke-[2.5]" />
        <span>Ask AI</span>
      </button>

      {/* Ask AI Chat Modal */}
      <AskAIModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </div>
  );
}
