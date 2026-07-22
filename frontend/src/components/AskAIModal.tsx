"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bot, User, Loader2, RefreshCw } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What are the top VLSI JRF opportunities in India?",
  "Am I eligible for ISRO scientist post with B.Tech ECE?",
  "What is the difference between JRF, SRF, and RA?",
  "How to prepare for DRDO scientist interview?",
];

interface AskAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AskAIModal({ isOpen, onClose }: AskAIModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Namaste! I am BerojgarDegreeWala AI Assistant. Ask me anything about semiconductor jobs, JRF/PhD research, ISRO/DRDO exams, or career advice!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    if (!queryText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("AI failed to respond");
      const data = await res.json();

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.message || "No response received." },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an issue. Please try asking again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-2xl h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-raised)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-base text-[var(--text)] flex items-center gap-2">
                BerojgarDegreeWala AI Assistant
                <span className="text-[10px] bg-[var(--primary-light)] text-[var(--primary)] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Live AI
                </span>
              </h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                Powered by Groq & Gemini — VLSI & Semiconductor Career Expert
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${
                m.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  m.role === "user"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[var(--primary)] text-white rounded-tr-none"
                    : "bg-[var(--surface-raised)] text-[var(--text)] rounded-tl-none border border-[var(--border-subtle)]"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Bot size={14} />
              </div>
              <div className="bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-2xl rounded-tl-none px-4 py-3 text-sm text-[var(--text-secondary)] flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-[var(--primary)]" />
                <span>AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Chips */}
        {messages.length <= 2 && (
          <div className="px-6 py-2 flex items-center gap-2 overflow-x-auto border-t border-[var(--border-subtle)] bg-[var(--surface-raised)]/50">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-xs whitespace-nowrap bg-[var(--surface)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] border border-[var(--border)] rounded-full px-3 py-1.5 transition text-[var(--text-secondary)]"
              >
                💡 {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about jobs, JRF, ISRO exams, eligibility..."
              className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white p-3 rounded-xl disabled:opacity-50 transition shadow-md flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
