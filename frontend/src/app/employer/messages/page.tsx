"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2, MessageSquare, Search, ArrowLeft, Send,
  User, Sparkles, Building2, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useConversations, useConversationMessages, useSendMessage } from "@/hooks/useMessages";
import MessageThread from "@/components/MessageThread";
import EmptyState from "@/components/shared/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface OtherUser {
  id: string;
  display_name: string | null;
  username?: string | null;
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

export default function EmployerMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isEmployer, isAdmin, loading: userLoading } = useUser();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<OtherUser | null>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!userLoading && !user) router.push("/login?redirectTo=/employer/messages");
    if (!userLoading && user && !isEmployer && !isAdmin) router.push("/dashboard");
  }, [user, isEmployer, isAdmin, userLoading, router]);

  const { data: convData, isLoading: convLoading } = useConversations();
  const conversations = useMemo(
    () => (convData?.conversations || []) as unknown as Conversation[],
    [convData?.conversations]
  );

  const { data: msgData } = useConversationMessages(activeConv ?? "");
  const messages = useMemo(() => (msgData?.messages || []) as unknown as Message[], [msgData?.messages]);

  const sendMessage = useSendMessage();

  useEffect(() => {
    const convParam = searchParams.get("conv");
    const userParam = searchParams.get("user");

    if (convParam) {
      setActiveConv(convParam);
      setTargetUser(null);
      return;
    }

    if (userParam && user) {
      const existing = conversations.find((c) => c.other_user?.id === userParam);
      if (existing) {
        setActiveConv(existing.id);
        setTargetUser(null);
      }
    }
  }, [searchParams, conversations, user]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConv),
    [conversations, activeConv]
  );

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.other_user?.display_name?.toLowerCase().includes(q) ||
        c.other_user?.headline?.toLowerCase().includes(q) ||
        c.last_message_preview?.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const handleSend = async () => {
    if (!text.trim() || !currentOtherUser) return;

    sendMessage.mutate(
      { participantId: currentOtherUser.id, content: text.trim() },
      {
        onSuccess: (res) => {
          setText("");
          if (res?.conversation_id) setActiveConv(res.conversation_id);
        },
        onError: () => toast.error("Failed to send message"),
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const currentOtherUser = activeConversation?.other_user ?? targetUser;

  return (
    <div className="min-h-screen bg-bg-primary py-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/employer/dashboard" className="text-xs font-bold text-slate-500 hover:text-blue-600">
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-blue-600" /> Recruiter Candidate Messages
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-medium">
            Real-time direct messaging with applicants and sourced research scholars.
          </p>
        </div>

        {/* MESSAGING COCKPIT */}
        <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-brutal-lg overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[550px]">

          {/* LEFT: CONVERSATION LIST */}
          <div className="border-r-2 border-slate-900 flex flex-col">
            <div className="p-4 border-b-2 border-slate-900 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search candidate conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {convLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">Loading chats...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-black text-slate-900">No active conversations</p>
                  <p className="text-[11px] text-slate-500">
                    Reach out to applicants from your ATS or Talent Sourcing pool.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = conv.id === activeConv;
                  const other = conv.other_user;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConv(conv.id);
                        setTargetUser(null);
                      }}
                      className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                        isSelected ? "bg-blue-50/80" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm shrink-0 shadow-brutal-sm">
                        {other?.avatar_url ? (
                          <img src={other.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          initials(other?.display_name)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {other?.display_name || "Candidate"}
                          </p>
                          {conv.last_message_at && (
                            <span className="text-[10px] font-bold text-slate-400 shrink-0">
                              {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                          {conv.last_message_preview || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: CHAT THREAD */}
          <div className="md:col-span-2 flex flex-col bg-slate-50/50">
            {currentOtherUser ? (
              <>
                {/* THREAD HEADER */}
                <div className="p-4 border-b-2 border-slate-900 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full border-2 border-slate-900 bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shadow-brutal-sm">
                      {currentOtherUser.avatar_url ? (
                        <img src={currentOtherUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        initials(currentOtherUser.display_name)
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900">
                        {currentOtherUser.display_name || "Candidate"}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold truncate">
                        {currentOtherUser.headline || "Hardware Engineer"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* MESSAGES SCROLL */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <div className="py-12 text-center text-xs font-bold text-slate-400">
                      Send a message to begin interviewing or discussing qualifications.
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === user?.id;
                      return (
                        <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] p-3 rounded-2xl border-2 border-slate-900 shadow-brutal-sm text-xs ${
                              isMe
                                ? "bg-blue-600 text-white font-medium"
                                : "bg-white text-slate-900 font-medium"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.body}</p>
                            <span
                              className={`text-[9px] font-bold mt-1 block ${
                                isMe ? "text-blue-100 text-right" : "text-slate-400"
                              }`}
                            >
                              {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* MESSAGE INPUT */}
                <div className="p-4 border-t-2 border-slate-900 bg-white flex items-end gap-2">
                  <textarea
                    rows={2}
                    placeholder="Type candidate message... (Press Enter to send)"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 p-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!text.trim() || sendMessage.isPending}
                    className="h-12 px-4 shrink-0"
                  >
                    {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
                <MessageSquare className="w-12 h-12 text-slate-300" />
                <h3 className="text-sm font-black text-slate-900">Select a Conversation</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Choose an applicant from the left panel to review message history and discuss interviews.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
