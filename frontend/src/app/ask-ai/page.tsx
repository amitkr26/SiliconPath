"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles, Send, Bot, User, Plus, Volume2, VolumeX, Mic, MicOff,
  Trash2, MessageSquare, ArrowLeft, Copy, Check,
  Cpu, CircuitBoard, GraduationCap, Code, Menu, X, Zap, BookOpen
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
}

// ponytail: LAYER 3 — frontend safety net. Strips <think>/reasoning tags that
// somehow survived both the gateway and API route filters.
function sanitizeAIContent(text: string): string {
  if (!text) return text;
  let cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<analysis>[\s\S]*?<\/analysis>/gi, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
    .replace(/<chain_of_thought>[\s\S]*?<\/chain_of_thought>/gi, "")
    .trim();
  cleaned = cleaned.replace(/<think>[\s\S]*$/i, "").trim();
  cleaned = cleaned.replace(/<analysis>[\s\S]*$/i, "").trim();
  cleaned = cleaned.replace(/<reasoning>[\s\S]*$/i, "").trim();
  cleaned = cleaned.replace(/<chain_of_thought>[\s\S]*$/i, "").trim();
  return cleaned;
}

// Simple markdown-to-HTML for AI responses (bold, italic, lists, code, headings)
function renderMarkdown(text: string): string {
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 rounded-xl p-3 my-2 text-xs overflow-x-auto"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
    // H3 headings
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-black text-slate-900 mt-3 mb-1">$1</h3>')
    // H2 headings
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-black text-slate-900 mt-4 mb-1">$1</h2>')
    // H1 headings
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-black text-slate-900 mt-4 mb-1">$1</h1>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li> items in <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>(\s*<br\/>)?)+/g, (match) => {
    return '<ul class="my-1 space-y-0.5">' + match.replace(/<br\/>/g, '') + '</ul>';
  });

  return html;
}

const SUGGESTIONS = [
  { icon: Cpu, label: "Find fresher VLSI jobs", query: "Find fresher VLSI jobs in semiconductor companies in India" },
  { icon: BookOpen, label: "Latest JRF opportunities", query: "What are the latest JRF opportunities in electronics and semiconductor research?" },
  { icon: GraduationCap, label: "GATE eligibility for DRDO", query: "Explain GATE eligibility criteria for DRDO Scientist B recruitment in Electronics" },
  { icon: CircuitBoard, label: "RTL Design Engineer roadmap", query: "What is the complete roadmap to become an RTL Design Engineer from scratch?" },
  { icon: Code, label: "Learn SystemVerilog", query: "How do I start learning SystemVerilog for ASIC verification as a fresher?" },
  { icon: Zap, label: "ISRO & DRDO guidance", query: "What is the best preparation strategy for ISRO and DRDO electronics recruitment?" },
];

export default function AskAIPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "session-1",
      title: "VLSI & Semiconductor Guidance",
      updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      messages: [
        {
          id: "m-1",
          role: "assistant",
          content:
            "Hello! I am BerojgarDegreeWala AI Career Assistant. Ask me anything about VLSI design, JRF research positions, ISRO/DRDO exams, semiconductor careers, or technical concepts!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    },
  ]);

  const [activeSessionId, setActiveSessionId] = useState<string>("session-1");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, loading]);

  // Focus input on mount and after sending
  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-IN";
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) setInput(transcript);
        setIsListening(false);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceListen = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const speakText = (id: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "New Conversation",
      updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      messages: [
        {
          id: `m-${Date.now()}`,
          role: "assistant",
          content: "Hello! How can I assist you with your semiconductor & VLSI career today?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setMobileSidebarOpen(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) return;
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) setActiveSessionId(filtered[0].id);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...currentSession.messages, userMsg];
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? {
        ...s,
        messages: updatedMessages,
        title: s.title === "New Conversation" || s.title === "VLSI & Semiconductor Guidance"
          ? query.slice(0, 30) + (query.length > 30 ? "..." : "")
          : s.title,
      } : s))
    );

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
      const rawReply = data.message || data.reply || data.content || "I am analyzing semiconductor opportunities and research data. Feel free to ask details about JRF, DRDO, ISRO, or VLSI design!";
      const replyContent = sanitizeAIContent(rawReply) || "I apologize — I wasn't able to generate a clear response. Please try rephrasing your question.";

      const botMsg: Message = {
        id: `b-${Date.now()}`,
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [...updatedMessages, botMsg] } : s))
      );
    } catch {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "I encountered a minor network issue. Please retry your query.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [...updatedMessages, errorMsg] } : s))
      );
    } finally {
      setLoading(false);
    }
  };

  const isEmptyState = currentSession.messages.length <= 1;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col md:flex-row">

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <aside className={`hidden md:flex bg-white border-r border-slate-200 flex-col shrink-0 transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-72"
      }`}>
        {/* Sidebar header */}
        <div className="p-3 border-b border-slate-200 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <>
              <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition">
                <ArrowLeft className="w-3.5 h-3.5" /> Home
              </Link>
              <div className="flex items-center gap-1">
                <button
                  onClick={createNewChat}
                  className="flex items-center gap-1 bg-blue-600 text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-blue-700 transition font-semibold"
                  title="New Chat"
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
                  title="Collapse"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col items-center gap-2">
              <button onClick={() => setSidebarCollapsed(false)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="Expand">
                <Menu className="w-4 h-4" />
              </button>
              <button onClick={createNewChat} className="p-2 bg-blue-600 text-white rounded-lg" title="New Chat">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {!sidebarCollapsed && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1.5">
              Recent
            </p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => { setActiveSessionId(s.id); setMobileSidebarOpen(false); }}
              title={s.title}
              className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-all ${
                activeSessionId === s.id
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                {!sidebarCollapsed && <span className="truncate">{s.title}</span>}
              </div>
              {!sidebarCollapsed && sessions.length > 1 && (
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition p-1 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* ═══ MOBILE DRAWER ═══ */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative bg-white w-72 max-w-[80vw] flex flex-col z-10 shadow-xl">
            <div className="flex items-center justify-between p-3 border-b border-slate-200">
              <span className="font-semibold text-sm text-slate-700">Conversations</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 p-1 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={createNewChat}
              className="mx-3 mt-3 flex items-center justify-center gap-2 bg-blue-600 text-white text-xs py-2.5 rounded-lg font-semibold"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 mt-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => { setActiveSessionId(s.id); setMobileSidebarOpen(false); }}
                  className={`flex items-center p-2.5 rounded-lg text-xs font-medium ${
                    activeSessionId === s.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{s.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MAIN CHAT AREA ═══ */}
      <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] min-w-0 bg-white">

        {/* Header */}
        <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-semibold text-sm text-slate-900 leading-tight">
                  BerojgarDegreeWala AI Assistant
                </h1>
                <p className="text-[11px] text-slate-500">Semiconductor &amp; VLSI Career Specialist</p>
              </div>
            </div>
          </div>
          <button
            onClick={createNewChat}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
          >
            <Plus className="w-3.5 h-3.5" /> New Chat
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {currentSession.messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] ${m.role === "user" ? "order-1" : ""}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-slate-100 text-slate-800 rounded-bl-md"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div
                        className="prose prose-sm prose-slate max-w-none [&_strong]:font-bold [&_ul]:my-1 [&_li]:ml-4"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={`flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 ${m.role === "user" ? "justify-end" : ""}`}>
                    <span>{m.timestamp}</span>
                    {m.role === "assistant" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => speakText(m.id, m.content)}
                          className="hover:text-blue-600 transition flex items-center gap-1"
                          aria-label={speakingMsgId === m.id ? "Stop speaking" : "Read aloud"}
                        >
                          {speakingMsgId === m.id ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          <span>{speakingMsgId === m.id ? "Stop" : "Listen"}</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(m.id, m.content)}
                          className="hover:text-blue-600 transition flex items-center gap-1"
                          aria-label="Copy message"
                        >
                          {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === m.id ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-pulse text-blue-500" />
                  <span className="text-sm text-slate-500">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Empty state suggestions */}
          {isEmptyState && (
            <div className="max-w-3xl mx-auto px-4 pb-6 -mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {SUGGESTIONS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSend(s.query)}
                      className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition text-left group"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0 group-hover:bg-blue-100 transition">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition">
                          {s.label}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{s.query}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-slate-200 bg-white p-3 sm:p-4 shrink-0">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <button
              onClick={toggleVoiceListen}
              className={`p-2.5 rounded-xl border transition shrink-0 ${
                isListening
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
              title="Voice input"
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isListening ? "Listening... speak now..." : "Ask about JRF, DRDO, ISRO, VLSI, RTL design..."}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
                disabled={loading}
                aria-label="Chat message input"
              />
            </div>

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
            AI responses may contain inaccuracies. Always verify with official sources.
          </p>
        </div>
      </div>
    </div>
  );
}
