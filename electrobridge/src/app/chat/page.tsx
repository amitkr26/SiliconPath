"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Zap, Sparkles, Plus, MessageSquare, Target, TrendingUp, Lightbulb, Route } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  provider?: string;
}

const SUGGESTIONS = [
  "Find JRF for NET Electronics",
  "DRDO vs CSIR opportunities",
  "International PhD for thin film researcher",
  "ISRO recruitment process",
  "How to apply for DAAD fellowship",
  "Difference between JRF and SRF",
];

const QUICK_ACTIONS = [
  { label: "Opportunity Matching", icon: Target, color: "text-accent" },
  { label: "Resume Scoring", icon: TrendingUp, color: "text-success" },
  { label: "Skill Gap Analysis", icon: Lightbulb, color: "text-warning" },
  { label: "Career Roadmap", icon: Route, color: "text-accent" },
];

function loadRecentChats(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("recentChats") || "[]");
  } catch {
    return [];
  }
}

function saveRecentChats(chats: string[]) {
  try {
    localStorage.setItem("recentChats", JSON.stringify(chats.slice(0, 20)));
  } catch {}
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm ElectroBridge Assistant. I can help you find opportunities, understand eligibility criteria, and guide you through research careers in electronics and semiconductor fields. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentChats, setRecentChats] = useState<string[]>(loadRecentChats);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setShowSuggestions(false);
    setRecentChats((prev) => {
      const next = [text, ...prev.filter((c) => c !== text)].slice(0, 20);
      saveRecentChats(next);
      return next;
    });
    const newMessages = [
      ...messages,
      { role: "user" as const, content: text },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("Chat failed");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          provider: data.provider,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "block" : "hidden"} lg:block w-[280px] flex-shrink-0`}>
          <div className="bg-surface border border-border rounded-xl p-4 space-y-6 sticky top-24">
            <button
              onClick={() => {
                setMessages([{
                  role: "assistant",
                  content: "Hi! I'm ElectroBridge Assistant. I can help you find opportunities, understand eligibility criteria, and guide you through research careers in electronics and semiconductor fields. What would you like to know?",
                }]);
                setShowSuggestions(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 border border-border rounded-lg text-accent text-sm font-medium hover:border-accent/50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              + New Chat
            </button>

            {recentChats.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Recent</p>
                <div className="space-y-1">
                  {recentChats.map((chat) => (
                    <button
                      key={chat}
                      onClick={() => sendMessage(chat)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50 transition-colors truncate"
                    >
                      <MessageSquare className="w-3.5 h-3.5 inline mr-2 text-text-muted" />
                      {chat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.label)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-elevated/50 transition-colors"
                    >
                      <Icon className={`w-4 h-4 ${action.color}`} />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-4 left-4 z-50 w-12 h-12 bg-accent text-bg-primary rounded-full flex items-center justify-center shadow-glow-btn"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Main chat area */}
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-text-primary flex items-center gap-2">
                  ElectroBridge AI
                  <span className="flex items-center gap-1 text-xs text-success font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Online
                  </span>
                </h1>
                <p className="text-text-muted text-xs">Semiconductor specialist</p>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="h-[500px] overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-accent" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-accent text-bg-primary"
                        : "bg-surface-elevated text-text-primary"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.provider && (
                      <p className="text-[10px] text-text-muted mt-1 opacity-60">
                        Powered by {msg.provider.charAt(0).toUpperCase() + msg.provider.slice(1)}
                      </p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-text-secondary" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-accent" />
                  </div>
                  <div className="bg-surface-elevated rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 text-accent animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {showSuggestions && messages.length === 1 && (
              <div className="px-4 pb-4">
                <p className="text-text-muted text-xs mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-accent" />
                  Try asking:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="px-3 py-1.5 bg-surface-elevated border border-border rounded-full text-text-secondary text-xs hover:border-accent/30 hover:text-accent transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about opportunities, careers, eligibility..."
                  disabled={loading}
                  className="flex-1 bg-surface-elevated border border-border text-text-primary text-sm rounded-full px-4 py-2.5 focus:ring-accent focus:border-accent outline-none disabled:opacity-50 placeholder:text-text-muted/50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-accent text-bg-primary rounded-full px-4 py-2.5 hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
