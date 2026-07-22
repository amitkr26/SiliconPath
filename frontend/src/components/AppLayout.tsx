"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AskAIModal from "./AskAIModal";
import { Sparkles } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChat = pathname === "/chat";
  const [aiModalOpen, setAiModalOpen] = useState(false);

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
      <main className="flex-1 pt-16">{children}</main>
      <Footer />

      {/* Floating Ask AI Button */}
      <button
        onClick={() => setAiModalOpen(true)}
        aria-label="Ask AI Assistant"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-3 rounded-full shadow-2xl font-semibold text-sm transition-all hover:scale-105 group"
      >
        <Sparkles size={18} className="animate-pulse" />
        <span>Ask AI</span>
      </button>

      {/* Ask AI Chat Modal */}
      <AskAIModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </div>
  );
}
