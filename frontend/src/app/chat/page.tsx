"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles, Send, Bot, User, Plus, Volume2, VolumeX, Mic, MicOff,
  Trash2, MessageSquare, ArrowLeft, RefreshCw, Copy, Check,
  Cpu, CircuitBoard, GraduationCap, Code, Menu, X
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

const DEFAULT_PROMPTS = [
  { icon: Cpu, label: "VLSI JRF Positions", query: "What are the latest JRF opportunities in VLSI and Semiconductor design in India?" },
  { icon: GraduationCap, label: "DRDO / ISRO Scientist Prep", query: "How do I prepare for DRDO and ISRO Scientist B recruitment exams for Electronics?" },
  { icon: CircuitBoard, label: "Physical Design Roadmap", query: "What is the complete roadmap and toolset required to become a Physical Design Engineer?" },
  { icon: Code, label: "SystemVerilog & UVM Guide", query: "Explain the key differences between SystemVerilog and UVM for ASIC verification." },
];

export default function ChatPage() {
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, loading]);

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
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }
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

  const handleSend = async (queryText?: string) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...currentSession.messages, userMsg];
    const newTitle = currentSession.messages.length <= 1 ? text.slice(0, 30) + "..." : currentSession.title;

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, title: newTitle, messages: updatedMessages } : s))
    );

    if (!queryText) setInput("");
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
      const aiResponseText = data.message || "I apologize, but I could not generate a response. Please try again.";

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [...updatedMessages, aiMsg] } : s))
      );
    } catch {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Network error encountered. Please verify your connection and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [...updatedMessages, errorMsg] } : s))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col md:flex-row">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4 text-blue-600" /> Back to Home
          </Link>
          <button
            onClick={createNewChat}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-xs px-3.5 py-1.5 rounded-full hover:bg-blue-700 transition font-semibold shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Recent Conversations
          </p>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-medium transition ${
                activeSessionId === s.id
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{s.title}</span>
              </div>
              {sessions.length > 1 && (
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative bg-white w-72 max-w-xs flex flex-col p-4 z-10 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <span className="font-bold text-slate-900 text-sm">Conversations</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-xs py-2.5 rounded-full font-semibold mb-4"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>
            <div className="flex-1 overflow-y-auto space-y-1">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => { setActiveSessionId(s.id); setMobileSidebarOpen(false); }}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium ${
                    activeSessionId === s.id ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="truncate">{s.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CHAT CANVAS */}
      <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] min-w-0 bg-slate-50">
        
        {/* HEADER */}
        <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-slate-900 leading-none flex items-center gap-2">
                  BerojgarDegreeWala AI Assistant
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                    Online
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5">Semiconductor & VLSI Career Specialist</p>
              </div>
            </div>
          </div>

          <button
            onClick={createNewChat}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-semibold transition px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> Reset
          </button>
        </header>

        {/* THREAD MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-3xl mx-auto w-full">
          {currentSession.messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 sm:gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  m.role === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-blue-600 text-white shadow-xs"
                }`}
              >
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="flex flex-col gap-1 max-w-[85%]">
                <div
                  className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none shadow-xs"
                      : "bg-white text-slate-900 border border-slate-200 rounded-tl-none shadow-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>

                <div className={`flex items-center gap-2 text-[10px] text-slate-400 px-1 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <span>{m.timestamp}</span>
                  {m.role === "assistant" && (
                    <>
                      <button
                        onClick={() => speakText(m.id, m.content)}
                        className="hover:text-blue-600 transition flex items-center gap-1"
                      >
                        {speakingMsgId === m.id ? <VolumeX className="w-3 h-3 text-blue-600" /> : <Volume2 className="w-3 h-3" />}
                        <span>{speakingMsgId === m.id ? "Stop" : "Listen"}</span>
                      </button>

                      <button
                        onClick={() => copyToClipboard(m.id, m.content)}
                        className="hover:text-blue-600 transition flex items-center gap-1"
                      >
                        {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === m.id ? "Copied" : "Copy"}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-600 flex items-center gap-2 shadow-xs">
                <Sparkles className="w-4 h-4 animate-spin text-blue-600" />
                <span>Analyzing VLSI intelligence...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* PRESET CHIPS */}
        {currentSession.messages.length <= 1 && (
          <div className="max-w-3xl mx-auto w-full px-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEFAULT_PROMPTS.map((p, i) => {
              const Icon = p.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSend(p.query)}
                  className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-white hover:border-blue-500 transition text-left shadow-2xs group"
                >
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {p.label}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{p.query}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* INPUT BAR */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <button
              onClick={toggleVoiceListen}
              className={`p-2.5 rounded-full border transition shrink-0 ${
                isListening
                  ? "bg-red-600 text-white border-red-700 animate-pulse"
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:text-blue-600"
              }`}
              title="Voice Input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isListening ? "Listening... speak now..." : "Ask AI about JRF, DRDO, ISRO, RTL, or VLSI jobs..."}
              className="flex-1 bg-slate-100 border border-slate-200 text-slate-900 text-xs sm:text-sm rounded-full px-4 py-2.5 focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="btn-glow text-white p-2.5 rounded-full disabled:opacity-40 transition shadow-xs flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
