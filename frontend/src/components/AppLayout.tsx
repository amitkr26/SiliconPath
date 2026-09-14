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
  const [aiModalOpen, setAiModalOpen] = useState(false);

  if (isAdmin) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">{children}</div>;
  }

  // Standalone Apps: Ask AI Opportunity Intelligence
  if (isChat) {
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
        className="fixed z-40 flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 sm:px-5 sm:py-3 rounded-full border border-blue-500/30 shadow-elevated hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-xs sm:text-sm group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))", right: "max(0.75rem, env(safe-area-inset-right, 0px))" }}
      >
        <Sparkles size={15} className="text-white fill-current sm:w-[18px] sm:h-[18px]" />
        <span>Ask AI</span>
      </button>

      {/* Ask AI Chat Modal */}
      <AskAIModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </div>
  );
}