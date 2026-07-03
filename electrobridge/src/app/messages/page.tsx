"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Send, MessageCircle, ArrowLeft, Search,
  Check, CheckCheck
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [newChatUserId, setNewChatUserId] = useState<string | null>(null);
  const [newChatMsg, setNewChatMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login");
      else {
        setCurrentUserId(data.user.id);
        // Check if ?user= param for new conversation
        const userId = searchParams.get("user");
        if (userId) setNewChatUserId(userId);
      }
    });
  }, [router, supabase, searchParams]);

  const loadConversations = async () => {
    const res = await fetch("/api/messages");
    const data = await res.json();
    setConversations(data.conversations || []);
    setLoading(false);
  };

  useEffect(() => { if (currentUserId) loadConversations(); }, [currentUserId]);

  const loadMessages = async (convId: string) => {
    setChatLoading(true);
    setActiveConv(convId);
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete("user");
    router.replace(`/messages?conv=${convId}`, { scroll: false });
    const res = await fetch(`/api/messages/${convId}`);
    const data = await res.json();
    setMessages(data.messages || []);
    setChatLoading(false);
    setNewChatUserId(null);
  };

  useEffect(() => {
    const conv = searchParams.get("conv");
    if (conv && currentUserId) loadMessages(conv);
  }, [currentUserId, searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (convId: string) => {
    if (!newMessage.trim()) return;
    const res = await fetch(`/api/messages/${convId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage.trim() }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      loadConversations();
    }
  };

  const handleStartChat = async () => {
    if (!newChatUserId || !newChatMsg.trim()) return;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: newChatUserId, content: newChatMsg.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewChatMsg("");
      setNewChatUserId(null);
      await loadConversations();
      loadMessages(data.conversation_id);
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to send");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[80vh]"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;
  }

  const activeConversation = conversations.find((c) => c.id === activeConv);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Messaging</h1>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Conversation list */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-surface border border-border text-text-primary text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none"
            />
          </div>

          <div className="space-y-1 max-h-[70vh] overflow-y-auto">
            {conversations
              .filter((c) => !search || c.other_user?.full_name?.toLowerCase().includes(search.toLowerCase()))
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadMessages(c.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left ${
                    activeConv === c.id ? "bg-accent/10 border border-accent/20" : "hover:bg-surface/80 border border-transparent"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-accent">{getInitials(c.other_user?.full_name || "")}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-text-primary text-sm font-medium truncate">{c.other_user?.full_name || "Unknown"}</span>
                      <span className="text-text-muted text-[10px] flex-shrink-0">{formatTime(c.last_message_at)}</span>
                    </div>
                    <p className="text-text-muted text-xs truncate mt-0.5">
                      {c.last_message_preview || "No messages yet"}
                    </p>
                    {(c.unread_count || 0) > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold mt-1">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              ))}

            {conversations.length === 0 && (
              <div className="text-center py-8 text-text-secondary text-sm">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No conversations yet
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 min-h-[60vh] bg-surface border border-border rounded-xl flex flex-col">
          {activeConv && activeConversation ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <button className="lg:hidden" onClick={() => setActiveConv(null)}>
                  <ArrowLeft className="w-5 h-5 text-text-secondary" />
                </button>
                <Link
                  href={`/people/${activeConversation.other_user?.username || activeConversation.other_user?.id}`}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-accent">{getInitials(activeConversation.other_user?.full_name || "")}</span>
                  </div>
                  <div>
                    <p className="text-text-primary text-sm font-medium">{activeConversation.other_user?.full_name}</p>
                    {activeConversation.other_user?.headline && (
                      <p className="text-text-muted text-xs">{activeConversation.other_user.headline}</p>
                    )}
                  </div>
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[55vh]">
                {chatLoading ? (
                  <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
                ) : (
                  <>
                    {messages.map((m) => {
                      const isMine = m.sender_id === currentUserId;
                      return (
                        <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            isMine
                              ? "bg-accent text-text-inverted rounded-br-md"
                              : "bg-surface-alt border border-border rounded-bl-md"
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                              <span className={`text-[10px] ${isMine ? "text-text-inverted/70" : "text-text-muted"}`}>
                                {formatTime(m.created_at)}
                              </span>
                              {isMine && (
                                m.is_read
                                  ? <CheckCheck className="w-3 h-3 text-text-inverted/70" />
                                  : <Check className="w-3 h-3 text-text-inverted/50" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage(activeConv))}
                    placeholder="Write a message..."
                    className="flex-1 bg-surface border border-border text-text-primary text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-accent"
                  />
                  <button
                    onClick={() => handleSendMessage(activeConv)}
                    disabled={!newMessage.trim()}
                    className="bg-accent text-text-inverted p-2.5 rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : newChatUserId ? (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <button onClick={() => { setNewChatUserId(null); router.push("/messages"); }}>
                  <ArrowLeft className="w-5 h-5 text-text-secondary" />
                </button>
                <p className="text-text-primary text-sm font-medium">New conversation</p>
              </div>
              <div className="flex-1 p-4">
                <textarea
                  value={newChatMsg}
                  onChange={(e) => setNewChatMsg(e.target.value)}
                  placeholder="Write your first message..."
                  rows={4}
                  className="w-full bg-surface border border-border text-text-primary text-sm rounded-lg p-3 outline-none resize-none"
                />
                <button
                  onClick={handleStartChat}
                  disabled={!newChatMsg.trim()}
                  className="mt-3 bg-accent text-text-inverted px-5 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
              <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="text-xs mt-1">or start a new one from someone&apos;s profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
