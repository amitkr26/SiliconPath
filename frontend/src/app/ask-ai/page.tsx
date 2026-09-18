"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Loader2,
  ArrowDown,
  Sparkles,
  Compass,
  Bookmark,
  Bell,
  Search,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useChatSessions, ChatMessageItem } from "./hooks/useChatSessions";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "./hooks/useSpeechSynthesis";
import { useSmartScroll } from "./hooks/useSmartScroll";
import { ChatHeader } from "./components/ChatHeader";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatMessage } from "./components/ChatMessage";
import { ChatComposer } from "./components/ChatComposer";
import { EmptyState } from "./components/EmptyState";
import { DiscoverView } from "./components/DiscoverView";
import { AlertsManager } from "./components/AlertsManager";
import { SavedView } from "./components/SavedView";
import { sanitizeAIContent } from "@/lib/ai/reasoning-sanitizer";

type IntelligenceMode = "ask_ai" | "discover" | "saved" | "alerts";

export default function OpportunityIntelligencePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [activeMode, setActiveMode] = useState<IntelligenceMode>("ask_ai");
  const [savedOpportunityIds, setSavedOpportunityIds] = useState<string[]>([]);

  const {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createNewSession,
    updateActiveMessages,
    renameSession,
    deleteSession,
    searchQuery,
    setSearchQuery,
    isLoaded,
  } = useChatSessions();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Load Saved IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bdw_saved_opportunities_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setSavedOpportunityIds(parsed);
      }
    } catch {}
  }, []);

  // Smart Scrolling Hook
  const {
    containerRef,
    showScrollBottomButton,
    scrollToBottom,
    triggerAutoScroll,
  } = useSmartScroll<HTMLDivElement>();

  // Speech Recognition Hook
  const speech = useSpeechRecognition((transcriptText) => {
    if (transcriptText) {
      setInput((prev) => (prev ? `${prev} ${transcriptText}` : transcriptText));
    }
  });

  // Speech Synthesis (TTS) Hook
  const tts = useSpeechSynthesis();

  // Trigger auto-scroll on new messages or loading change
  useEffect(() => {
    triggerAutoScroll();
  }, [activeSession.messages, loading, triggerAutoScroll]);

  const toggleSaveOpportunity = (id: string) => {
    setSavedOpportunityIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem("bdw_saved_opportunities_v1", JSON.stringify(updated));
      } catch {}
      toast.success(prev.includes(id) ? "Opportunity removed from saved." : "Opportunity saved to bookmarks!");
      return updated;
    });
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    // Switch to ask_ai mode if on another tab
    if (activeMode !== "ask_ai") {
      setActiveMode("ask_ai");
    }

    // Stop active TTS speaking when new query starts
    tts.stop();

    const userMsg: ChatMessageItem = {
      id: `u-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...activeSession.messages, userMsg];
    updateActiveMessages(updatedMessages);

    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        toast.error(data.error || "Rate limit exceeded. Please sign in.");
      }

      const rawReply =
        data.answer ||
        data.message ||
        data.reply ||
        (data.error
          ? `Notice: ${data.error}`
          : "I am analyzing semiconductor opportunities and research data. Feel free to ask details about JRF, DRDO, ISRO, or VLSI design!");

      const cleanReply = sanitizeAIContent(rawReply);

      const assistantMsg: ChatMessageItem = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: cleanReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        opportunities: data.opportunities || [],
        sources: data.sources || [],
        citations: data.citations || [],
        domain: data.domain || undefined,
        toolResults: data.toolResults || undefined,
      };

      updateActiveMessages([...updatedMessages, assistantMsg]);
    } catch (err: any) {
      toast.error(err.message || "Failed to reach AI assistant");
      const errorMsg: ChatMessageItem = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "I'm having trouble connecting to the network right now. Please try again in a few moments.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      updateActiveMessages([...updatedMessages, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (promptText: string) => {
    setInput(promptText);
    handleSend(promptText);
  };

  const isInitialEmpty =
    activeSession.messages.length <= 1 &&
    activeSession.messages[0]?.role === "assistant";

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-50 font-sans">
      {/* ═══ COLLAPSIBLE SIDEBAR ═══ */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setActiveMode("ask_ai");
        }}
        onNewChat={() => {
          createNewSession();
          setActiveMode("ask_ai");
        }}
        onRenameSession={renameSession}
        onDeleteSession={deleteSession}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* ═══ MAIN WORKSPACE ═══ */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-slate-50/50 relative overflow-hidden">
        {/* Top Intelligence Mode Bar */}
        <header className="h-14 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <ChatHeader
              onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
              onNewChat={() => {
                createNewSession();
                setActiveMode("ask_ai");
              }}
            />
          </div>

          {/* Intelligence Mode Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {[
              { id: "ask_ai", label: "Ask AI", icon: Sparkles },
              { id: "discover", label: "Discover", icon: Compass },
              { id: "saved", label: `Saved (${savedOpportunityIds.length})`, icon: Bookmark },
              { id: "alerts", label: "Alerts", icon: Bell },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMode(tab.id as IntelligenceMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                    isActive
                      ? "bg-white text-blue-600 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* ═══ VIEW ROUTER ═══ */}
        {activeMode === "discover" && (
          <div className="flex-1 overflow-y-auto">
            <DiscoverView
              savedIds={savedOpportunityIds}
              onToggleSave={toggleSaveOpportunity}
              onSelectForAI={handleSelectPrompt}
            />
          </div>
        )}

        {activeMode === "saved" && (
          <div className="flex-1 overflow-y-auto">
            <SavedView
              savedIds={savedOpportunityIds}
              onToggleSave={toggleSaveOpportunity}
              onSelectForAI={handleSelectPrompt}
            />
          </div>
        )}

        {activeMode === "alerts" && (
          <div className="flex-1 overflow-y-auto">
            <AlertsManager />
          </div>
        )}

        {activeMode === "ask_ai" && (
          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* Scrollable Chat Message Feed */}
            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scroll-smooth"
            >
              <div className="max-w-4xl mx-auto space-y-5">
                {isInitialEmpty ? (
                  <EmptyState onSelectSuggestion={handleSelectPrompt} />
                ) : (
                  activeSession.messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isSpeaking={tts.speakingMsgId === msg.id}
                      onSpeak={tts.speak}
                      onStopSpeak={tts.stop}
                      savedIds={savedOpportunityIds}
                      onToggleSave={toggleSaveOpportunity}
                    />
                  ))
                )}

                {/* Loading State Skeleton */}
                {loading && (
                  <div className="flex gap-3.5 items-start animate-in fade-in duration-200">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shrink-0 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-sm px-4 py-3 shadow-2xs flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      <span>Synthesizing verified research opportunities &amp; career intelligence...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scroll to Bottom Button */}
            {showScrollBottomButton && (
              <button
                onClick={() => scrollToBottom()}
                className="absolute bottom-20 right-8 z-20 p-2.5 bg-white border border-slate-200 text-slate-700 rounded-full shadow-md hover:bg-slate-50 hover:text-blue-600 transition animate-in fade-in"
                title="Scroll to bottom"
                aria-label="Scroll to bottom"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            )}

            {/* Bottom Input Composer */}
            <div className="p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shrink-0">
              <div className="max-w-4xl mx-auto">
                <ChatComposer
                  input={input}
                  setInput={setInput}
                  onSend={() => handleSend()}
                  loading={loading}
                  speech={speech}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
