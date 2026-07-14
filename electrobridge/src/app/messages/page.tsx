"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Send, MessageCircle, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useConversations, useConversationMessages, useSendMessage } from "@/hooks/useMessages";

interface OtherUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  headline: string | null;
}
interface Conversation {
  id: string;
  last_message_at: string | null;
  other_user: OtherUser | null;
  last_message_preview: string;
  unread_count: number;
}
interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function fmtTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userLoading && !user) router.push("/login?redirectTo=/messages");
  }, [user, userLoading, router]);

  const { data: convData, isLoading: convLoading } = useConversations();
  const conversations = (convData?.conversations || []) as unknown as Conversation[];

  const { data: msgData } = useConversationMessages(activeConv ?? "");
  const messages = useMemo(() => (msgData?.messages || []) as unknown as Message[], [msgData?.messages]);

  const sendMessage = useSendMessage();

  useEffect(() => {
    const conv = searchParams.get("conv");
    if (conv) setActiveConv(conv);
  }, [searchParams]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const active = conversations.find((c) => c.id === activeConv);
  const filtered = conversations.filter(
    (c) => !search || (c.other_user?.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const send = () => {
    if (!text.trim() || !activeConv || !active?.other_user) return;
    sendMessage.mutate(
      { participantId: active.other_user.id, content: text.trim() },
      {
        onSuccess: () => setText(""),
        onError: () => toast.error("Failed to send"),
      }
    );
  };

  if (userLoading || convLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Messages</h1>
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[70vh]">
          {/* Conversation list */}
          <div className={`bg-bg-secondary border border-border rounded-xl p-3 overflow-y-auto ${activeConv ? "hidden md:block" : ""}`}>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg pl-9 pr-3 py-2 outline-none"
              />
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-text-muted">
                <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No conversations yet</p>
              </div>
            )}
            <div className="space-y-1">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveConv(c.id)}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
                    activeConv === c.id ? "bg-accent/10" : "hover:bg-bg-primary"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {initials(c.other_user?.display_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <span className="text-sm font-medium text-text-primary truncate">
                        {c.other_user?.display_name || "Member"}
                      </span>
                      <span className="text-xs text-text-muted flex-shrink-0">{fmtTime(c.last_message_at)}</span>
                    </div>
                    <p className="text-xs text-text-secondary truncate">{c.last_message_preview}</p>
                  </div>
                  {c.unread_count > 0 && (
                    <span className="bg-accent text-white text-[10px] rounded-full px-1.5 py-0.5 flex-shrink-0">
                      {c.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className={`bg-bg-secondary border border-border rounded-xl flex flex-col ${activeConv ? "" : "hidden md:flex"}`}>
            {active ? (
              <>
                <div className="flex items-center gap-3 p-3 border-b border-border">
                  <button onClick={() => setActiveConv(null)} className="md:hidden text-text-secondary">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-bold">
                    {initials(active.other_user?.display_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {active.other_user?.display_name || "Member"}
                    </p>
                    {active.other_user?.headline && (
                      <p className="text-xs text-text-muted truncate">{active.other_user.headline}</p>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                            mine ? "bg-accent text-white" : "bg-bg-primary text-text-primary border border-border"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <span className={`block text-[10px] mt-1 ${mine ? "text-white/70" : "text-text-muted"}`}>
                            {fmtTime(m.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>

                <div className="flex items-center gap-2 p-3 border-t border-border">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Write a message..."
                    className="flex-1 bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-4 py-2.5 outline-none"
                  />
                  <button
                    onClick={send}
                    disabled={!text.trim()}
                    className="bg-accent text-white p-2.5 rounded-lg disabled:opacity-50"
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <MessageCircle className="w-10 h-10 text-text-muted mb-3" />
                <p className="text-text-primary font-medium">Select a conversation</p>
                <p className="text-text-secondary text-sm mt-1">
                  Start one from a connection&apos;s profile.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
