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
  const isChat = pathname === "/chat" || pathname.startsWith("/ask-ai");
  const isResume = pathname === "/resume" || pathname.startsWith("/resume");
  const [aiModalOpen, setAiModalOpen] = useState(false);

  if (isAdmin) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">{children}</div>;
  }

  // Standalone Apps: Resume Studio & Ask AI Opportunity Intelligence
  if (isChat || isResume) {
    return (
      <div className="flex flex-col min-h-screen h-screen w-full overflow-hidden bg-white">
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:text-sm focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1" tabIndex={-1}>{children}</main>
      <Footer />

      {/* Floating Ask AI Button — safe-area-aware for iOS notch/BB */}
      <button
        onClick={() => setAiModalOpen(true)}
        aria-label="Ask AI Assistant"
        className="fixed z-40 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl border-2 border-slate-900 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-0.5 transition-all font-black text-xs sm:text-sm group"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))", right: "1rem" }}
      >
        <Sparkles size={18} className="text-white fill-current" />
        <span>Ask AI</span>
      </button>

      {/* Ask AI Chat Modal */}
      <AskAIModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </div>
  );
}