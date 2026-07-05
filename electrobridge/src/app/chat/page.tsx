"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Send, Bot, User, Loader2, Zap, Sparkles, Plus, MessageSquare, 
  Target, TrendingUp, Lightbulb, Route, Menu, X, ChevronLeft, 
  ChevronRight, PanelLeftClose, PanelLeft, ArrowRight, LogOut, 
  LayoutDashboard 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

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
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm SiliconPath Assistant. I can help you find opportunities, understand eligibility criteria, and guide you through research careers in electronics and semiconductor fields. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Sidebar states
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [recentChats, setRecentChats] = useState<string[]>(loadRecentChats);

  // User state
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  // Sync auth state
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Sync client mount and localStorage sidebar preference
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("chat_sidebar_expanded");
    if (saved !== null) {
      setIsSidebarExpanded(saved === "true");
    } else {
      if (window.innerWidth < 1024) {
        setIsSidebarExpanded(false);
      }
    }
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle textarea resize based on content height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const toggleSidebar = () => {
    const next = !isSidebarExpanded;
    setIsSidebarExpanded(next);
    localStorage.setItem("chat_sidebar_expanded", String(next));
  };

  const resetChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm SiliconPath Assistant. I can help you find opportunities, understand eligibility criteria, and guide you through research careers in electronics and semiconductor fields. What would you like to know?",
      },
    ]);
    setShowSuggestions(true);
    setInput("");
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserDropdownOpen(false);
    router.push("/");
    router.refresh();
  };

  const initials = (name?: string | null, email?: string) => {
    if (name) return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
    return email?.substring(0, 2).toUpperCase() ?? "U";
  };

  const displayName = user?.user_metadata?.full_name || user?.email || "User";
  const isAdmin = user?.user_metadata?.role === "admin";

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
    <div className="flex flex-col h-screen max-h-screen min-h-screen bg-navy text-text-primary overflow-hidden">
      {/* Minimal Top Bar */}
      <header className="h-14 border-b border-border bg-bg-primary/95 backdrop-blur px-4 flex items-center justify-between z-40 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Trigger */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Desktop Sidebar Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="hidden md:block p-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
            title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarExpanded ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
          </button>

          {/* SiliconPath Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 group-hover:from-accent/30 group-hover:to-accent/10 transition-all shadow-glow-sm">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-text-primary whitespace-nowrap">
              Silicon<span className="text-accent">Path</span>
            </span>
          </Link>
        </div>

        {/* User Auth Section */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium rounded-lg hover:bg-surface-elevated transition-all border border-transparent hover:border-border/50"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                  <span className="text-accent text-xs font-bold">
                    {initials(user.user_metadata?.full_name, user.email)}
                  </span>
                </div>
                <span className="hidden sm:inline text-text-secondary max-w-[120px] truncate">{displayName}</span>
              </button>
              
              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-surface/95 backdrop-blur-xl border border-border/80 rounded-xl shadow-2xl py-2 z-50 origin-top-right animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-border/50 mb-1">
                    <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
                    <p className="text-xs text-text-muted truncate mt-0.5">{user.email}</p>
                  </div>
                  <Link href="/dashboard" onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors mx-1.5 rounded-lg">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link href="/profile" onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors mx-1.5 rounded-lg">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors mx-1.5 rounded-lg">
                      <MessageSquare className="w-4 h-4" /> Admin
                    </Link>
                  )}
                  <div className="border-t border-border/50 my-1 mx-3" />
                  <button onClick={signOut}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors w-full text-left mx-1.5 rounded-lg">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login"
                className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-elevated">
                Log in
              </Link>
              <Link href="/signup"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 text-sm font-semibold bg-gradient-to-r from-accent to-accent-hover text-bg-primary rounded-lg hover:brightness-110 transition-all">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main App Container */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Desktop Collapsible Sidebar */}
        <aside 
          className={`hidden md:flex flex-col bg-surface border-r border-border h-full transition-all duration-200 ease-in-out flex-shrink-0 ${
            isSidebarExpanded ? "w-[280px]" : "w-16"
          }`}
        >
          <div className="flex flex-col h-full p-3 justify-between overflow-y-auto overflow-x-hidden">
            <div className="space-y-4">
              {/* New Chat Button */}
              {isSidebarExpanded ? (
                <button
                  onClick={resetChat}
                  className="w-full flex items-center gap-2 px-3 py-2.5 border border-border rounded-lg text-accent text-sm font-medium hover:bg-accent/5 hover:border-accent/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Chat</span>
                </button>
              ) : (
                <button
                  onClick={resetChat}
                  className="w-10 h-10 mx-auto flex items-center justify-center border border-border rounded-xl text-accent hover:bg-accent/5 hover:border-accent/30 transition-all"
                  title="New Chat"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}

              {/* Recent Chat History */}
              {recentChats.length > 0 && (
                <div className="space-y-1">
                  {isSidebarExpanded ? (
                    <>
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-3 mb-1">Recent</p>
                      <div className="space-y-0.5">
                        {recentChats.map((chat) => (
                          <button
                            key={chat}
                            onClick={() => sendMessage(chat)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors truncate text-left"
                            title={chat}
                          >
                            <MessageSquare className="w-4 h-4 text-text-muted flex-shrink-0" />
                            <span className="truncate">{chat}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1">
                      {recentChats.slice(0, 5).map((chat, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(chat)}
                          className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-text-secondary hover:bg-surface-elevated transition-colors"
                          title={chat}
                        >
                          <MessageSquare className="w-4 h-4 text-text-muted" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions at bottom */}
            <div className="pt-4 border-t border-border/50 space-y-1">
              {isSidebarExpanded ? (
                <>
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-3 mb-2">Quick Actions</p>
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={() => sendMessage(action.label)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-elevated transition-colors text-left"
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${action.color}`} />
                        <span className="truncate">{action.label}</span>
                      </button>
                    );
                  })}
                </>
              ) : (
                <div className="space-y-1">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={() => sendMessage(action.label)}
                        className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-text-secondary hover:bg-surface-elevated transition-colors"
                        title={action.label}
                      >
                        <Icon className={`w-4 h-4 ${action.color}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Slide-over Overlay Drawer */}
        {isMounted && isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            
            {/* Drawer */}
            <div className="relative flex flex-col w-[280px] max-w-xs h-full bg-surface border-r border-border p-4 justify-between z-10 animate-in slide-in-from-left duration-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-text-muted uppercase tracking-wider">SiliconPath AI</span>
                  <button 
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1.5 hover:bg-surface-elevated rounded-lg text-text-secondary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    resetChat();
                    setIsMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 border border-border rounded-lg text-accent text-sm font-medium hover:bg-accent/5 hover:border-accent/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Chat</span>
                </button>

                {recentChats.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Recent</p>
                    <div className="space-y-0.5 max-h-[40vh] overflow-y-auto">
                      {recentChats.map((chat) => (
                        <button
                          key={chat}
                          onClick={() => {
                            sendMessage(chat);
                            setIsMobileSidebarOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors truncate text-left"
                          title={chat}
                        >
                          <MessageSquare className="w-4 h-4 text-text-muted flex-shrink-0" />
                          <span className="truncate">{chat}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border/50 pt-4 space-y-1">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Quick Actions</p>
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => {
                        sendMessage(action.label);
                        setIsMobileSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-elevated transition-colors text-left"
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${action.color}`} />
                      <span className="truncate">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Panel */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative bg-bg-primary">
          {/* Messages Scrolling Area */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            {/* Centered Empty State */}
            {messages.length === 1 && showSuggestions ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                  <Bot className="w-8 h-8 text-accent animate-pulse" />
                </div>
                <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
                  How can I help you today?
                </h2>
                <p className="text-text-secondary text-sm mb-8 max-w-md leading-relaxed">
                  {"I'm your semiconductor, VLSI, and hardware engineering AI specialist. Ask me about vacancies, PhD admissions, resume formatting, or study roadmaps."}
                </p>
                
                <div className="w-full">
                  <p className="text-text-muted text-xs mb-3 flex items-center justify-center gap-1.5 font-medium uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    Try Asking
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-left px-4 py-3 bg-surface border border-border hover:border-accent/30 hover:bg-surface-elevated rounded-xl text-text-secondary hover:text-text-primary text-xs transition-all duration-200 shadow-sm"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Message List */
              <div className="flex-1 overflow-y-auto py-6 space-y-6">
                <div className="max-w-3xl mx-auto px-4 space-y-6">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 shadow-sm border border-accent/20">
                          <Zap className="w-4 h-4 text-accent" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-sm border ${
                          msg.role === "user"
                            ? "bg-accent/15 border-accent/30 text-text-primary"
                            : "bg-surface-elevated border-border text-text-primary"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        {msg.provider && (
                          <p className="text-[10px] text-text-muted mt-1.5 opacity-60">
                            Powered by {msg.provider.charAt(0).toUpperCase() + msg.provider.slice(1)}
                          </p>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-text-secondary" />
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 border border-accent/20">
                        <Zap className="w-4 h-4 text-accent animate-pulse" />
                      </div>
                      <div className="bg-surface-elevated border border-border rounded-2xl px-4 py-3 flex items-center">
                        <Loader2 className="w-4 h-4 text-accent animate-spin" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Chat Input Form */}
          <div className="border-t border-transparent bg-gradient-to-t from-bg-primary via-bg-primary/95 to-transparent pt-4 pb-6 px-4 flex-shrink-0">
            <div className="max-w-3xl mx-auto relative">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="relative flex items-end bg-surface-elevated border border-border focus-within:border-accent/40 rounded-2xl p-2 transition-all shadow-lg"
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask about opportunities, careers, eligibility..."
                  disabled={loading}
                  rows={1}
                  className="flex-1 bg-transparent text-text-primary text-sm pl-4 pr-12 py-3 focus:outline-none resize-none min-h-[44px] max-h-[160px] overflow-y-auto placeholder:text-text-muted/50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-3 bottom-3 bg-accent text-bg-primary rounded-xl p-2.5 hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>
              <p className="text-[10px] text-text-muted text-center mt-2.5 opacity-60">
                SiliconPath AI matches content dynamically and can make mistakes. Verify critical deadlines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
