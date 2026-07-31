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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) return;
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
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
      prev.map((s) => (s.id === activeSessionId ? { ...s, messages: updatedMessages, title: s.title === "New Conversation" || s.title === "VLSI & Semiconductor Guidance" ? query.slice(0, 30) + "..." : s.title } : s))
    );

    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const replyContent = data.reply || data.content || "I am analyzing semiconductor opportunities and research data. Feel free to ask details about JRF, DRDO, ISRO, or VLSI design!";

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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex flex-col md:flex-row">
      
      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden md:flex bg-white border-r-3 border-slate-900 flex-col shrink-0 transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-72"
      }`}>
        <div className="p-3.5 border-b-2 border-slate-900 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <>
              <Link href="/" className="flex items-center gap-1.5 text-xs font-black text-slate-800 hover:text-blue-600 transition">
                <ArrowLeft className="w-4 h-4 text-blue-600 stroke-[3]" /> Home
              </Link>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={createNewChat}
                  className="flex items-center gap-1.5 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-xl hover:bg-blue-700 transition font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
                  title="New Chat"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" /> New
                </button>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-900"
                  title="Collapse Sidebar"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col items-center gap-3">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 text-slate-900 hover:bg-blue-50 hover:text-blue-600 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
                title="Expand Sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
              <button
                onClick={createNewChat}
                className="p-2 bg-blue-600 text-white rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
                title="New Chat"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {!sidebarCollapsed && (
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 py-1">
              Recent Conversations
            </p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              title={s.title}
              className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-bold border-2 transition-all ${
                activeSessionId === s.id
                  ? "bg-blue-600 text-white border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
                  : "bg-white text-slate-800 border-transparent hover:bg-slate-100 hover:border-slate-900"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className={`w-4 h-4 shrink-0 ${activeSessionId === s.id ? "text-white" : "text-slate-700"}`} />
                {!sidebarCollapsed && <span className="truncate">{s.title}</span>}
              </div>
              {!sidebarCollapsed && sessions.length > 1 && (
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className={`opacity-0 group-hover:opacity-100 transition p-1 ${activeSessionId === s.id ? "text-white hover:text-red-200" : "text-slate-400 hover:text-red-600"}`}
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative bg-white w-72 max-w-xs flex flex-col p-4 z-10 shadow-2xl border-r-3 border-slate-900">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-3">
              <span className="font-black text-slate-900 text-sm">Conversations</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-700 p-1 border border-slate-900 rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-xs py-2.5 rounded-xl font-black border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] mb-4"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> New Chat
            </button>
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => { setActiveSessionId(s.id); setMobileSidebarOpen(false); }}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border-2 ${
                    activeSessionId === s.id ? "bg-blue-600 text-white border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]" : "bg-slate-50 text-slate-900 border-slate-900"
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
      <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] min-w-0 bg-[#FAF9F6]">
        
        {/* HEADER */}
        <header className="h-14 border-b-3 border-slate-900 bg-white px-4 flex items-center justify-between shrink-0 shadow-[0_2px_0px_0px_#0F172A]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg border-2 border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-white font-bold shadow-[2px_2px_0px_0px_#0F172A]">
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="font-black text-sm text-slate-900 leading-none flex items-center gap-2">
                  BerojgarDegreeWala AI Assistant
                  <span className="text-[10px] bg-emerald-400 text-slate-900 px-2 py-0.5 rounded-md font-black border border-slate-900">
                    Online
                  </span>
                </h1>
                <p className="text-[11px] text-slate-600 mt-0.5 font-bold">Semiconductor &amp; VLSI Career Specialist</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={createNewChat}
              className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-1.5 rounded-xl font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A] transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> New Chat
            </button>
          </div>
        </header>

        {/* MESSAGES LIST */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {currentSession.messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-xl border-2 border-slate-900 flex items-center justify-center shrink-0 font-bold shadow-[2px_2px_0px_0px_#0F172A] ${
                  m.role === "user" ? "bg-slate-900 text-white" : "bg-blue-600 text-white"
                }`}
              >
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm border-2 border-slate-900 leading-relaxed shadow-[3px_3px_0px_0px_#0F172A] ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white text-slate-900 rounded-tl-none font-medium"
                }`}
              >
                <div className="whitespace-pre-line font-medium">{m.content}</div>

                <div className="mt-2.5 pt-2 border-t border-slate-900/20 flex items-center justify-between text-[11px] font-bold text-slate-500 gap-4">
                  <span>{m.timestamp}</span>
                  {m.role === "assistant" && (
                    <div className="flex items-center gap-2">
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 border-2 border-slate-900">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border-2 border-slate-900 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-900 flex items-center gap-2 shadow-[3px_3px_0px_0px_#0F172A] font-black">
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
                  className="flex items-start gap-3 p-3.5 rounded-2xl border-2 border-slate-900 bg-white hover:bg-blue-50 transition text-left shadow-[3px_3px_0px_0px_#0F172A] group"
                >
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-600 border border-slate-900 shrink-0">
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition">
                      {p.label}
                    </p>
                    <p className="text-[11px] text-slate-600 font-bold line-clamp-1 mt-0.5">{p.query}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* INPUT BAR */}
        <div className="p-3 sm:p-4 border-t-3 border-slate-900 bg-white shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <button
              onClick={toggleVoiceListen}
              className={`p-2.5 rounded-xl border-2 border-slate-900 transition shrink-0 shadow-[2px_2px_0px_0px_#0F172A] ${
                isListening
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-slate-100 text-slate-900 hover:bg-blue-50"
              }`}
              title="Voice Input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 stroke-[2.5]" />}
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
              className="flex-1 bg-white border-2 border-slate-900 text-slate-900 text-xs sm:text-sm rounded-xl px-4 py-2.5 font-bold shadow-[2px_2px_0px_0px_#0F172A] focus:outline-none focus:shadow-[4px_4px_0px_0px_#0F172A] transition"
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl border-2 border-slate-900 disabled:opacity-40 transition shadow-[2px_2px_0px_0px_#0F172A] flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
