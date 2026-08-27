"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, MessageCircle, Search, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useConversations, useConversationMessages, useSendMessage } from "@/hooks/useMessages";
import EmptyState from "@/components/shared/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<OtherUser | null>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userLoading && !user) router.push("/login?redirectTo=/messages");
  }, [user, userLoading, router]);

  const { data: convData, isLoading: convLoading } = useConversations();
  const conversations = useMemo(
    () => (convData?.conversations || []) as unknown as Conversation[],
    [convData?.conversations]
  );

  const { data: msgData } = useConversationMessages(activeConv ?? "");
  const messages = useMemo(() => (msgData?.messages || []) as unknown as Message[], [msgData?.messages]);

  const sendMessage = useSendMessage();

  useEffect(() => {
    const convParam = searchParams.get("conv") || searchParams.get("convId");
    const userParam = searchParams.get("user") || searchParams.get("userId");

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
      } else {
        fetch(`/api/profile/${userParam}`)
          .then((res) => res.json())
          .then((data: any) => {
            if (data && data.id) {
              setTargetUser({
                id: data.id,
                display_name: data.display_name || "Hardware Member",
                avatar_url: data.avatar_url,
                headline: data.headline,
              });
              setActiveConv(null);
            }
          })
          .catch(() => {});
      }
    }
  }, [searchParams, conversations, user]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const active = conversations.find((c) => c.id === activeConv);
  const activeOtherUser = active?.other_user || targetUser;

  const filtered = conversations.filter(
    (c) => !search || (c.other_user?.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const send = () => {
    if (!text.trim() || !activeOtherUser) return;
    sendMessage.mutate(
      { participantId: activeOtherUser.id, content: text.trim() },
      {
        onSuccess: (data) => {
          setText("");
          if (data?.conversation_id) {
            setActiveConv(data.conversation_id);
            setTargetUser(null);
          }
          toast.success("Message sent!");
        },
        onError: () => toast.error("Failed to send message"),
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) send();
    }
  };

  if (userLoading || convLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const showConversationList = !activeConv && !targetUser;
  const showChat = activeConv || targetUser;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5">Private conversations with hardware engineers and researchers</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex" style={{ height: "calc(100vh - 200px)" }}>
          {/* Left Panel - Conversation List */}
          <div
            className={cn(
              "w-80 border-r border-gray-200 flex flex-col flex-shrink-0",
              showChat ? "hidden md:flex" : "flex"
            )}
          >
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 && !targetUser ? (
                <EmptyState
                  icon={<MessageCircle size={24} />}
                  title="No conversations yet"
                  description="Start by connecting with someone from their profile."
                />
              ) : (
                <div>
                  {targetUser && !activeConv && (
                    <div className="p-3 bg-blue-50 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold">
                        {initials(targetUser.display_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{targetUser.display_name}</p>
                        <span className="text-xs text-blue-600 font-medium">New Conversation</span>
                      </div>
                    </div>
                  )}

                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveConv(c.id);
                        setTargetUser(null);
                      }}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 text-left transition-colors border-b border-gray-50",
                        activeConv === c.id ? "bg-blue-50 border-l-2 border-l-blue-600" : "hover:bg-gray-50",
                        c.unread_count > 0 && "border-l-2 border-l-blue-500 bg-blue-50/30"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-semibold shrink-0 overflow-hidden">
                        {c.other_user?.avatar_url ? (
                          <Image src={c.other_user.avatar_url} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover" unoptimized />
                        ) : (
                          initials(c.other_user?.display_name)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-1">
                          <span className={cn("text-sm truncate", c.unread_count > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700")}>
                            {c.other_user?.display_name || "Member"}
                          </span>
                          <span className="text-xs text-gray-400 shrink-0">
                            {c.last_message_at
                              ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false })
                              : ""}
                          </span>
                        </div>
                        <p className={cn("text-xs truncate mt-0.5", c.unread_count > 0 ? "text-gray-700 font-medium" : "text-gray-500")}>
                          {c.last_message_preview}
                        </p>
                      </div>
                      {c.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                          {c.unread_count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Active Conversation */}
          <div
            className={cn(
              "flex-1 flex flex-col min-w-0",
              showChat ? "flex" : "hidden md:flex"
            )}
          >
            {activeOtherUser ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
                  <button
                    onClick={() => {
                      setActiveConv(null);
                      setTargetUser(null);
                    }}
                    className="md:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                    aria-label="Back"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-semibold shrink-0 overflow-hidden">
                    {activeOtherUser.avatar_url ? (
                      <Image src={activeOtherUser.avatar_url} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover" unoptimized />
                    ) : (
                      initials(activeOtherUser.display_name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {activeOtherUser.display_name || "Member"}
                    </p>
                    {activeOtherUser.headline && (
                      <p className="text-xs text-gray-500 truncate">{activeOtherUser.headline}</p>
                    )}
                  </div>
                </div>

                {/* Messages Thread */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-gray-500">
                        Start a conversation with {activeOtherUser.display_name || "this person"}.
                      </p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn("flex items-end gap-2", isMine ? "flex-row-reverse" : "flex-row")}
                      >
                        {!isMine && (
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-semibold overflow-hidden">
                            {activeOtherUser.avatar_url ? (
                              <Image src={activeOtherUser.avatar_url} alt="" width={28} height={28} className="w-7 h-7 rounded-full object-cover" unoptimized />
                            ) : initials(activeOtherUser.display_name)}
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words",
                            isMine
                              ? "bg-blue-600 text-white rounded-br-md"
                              : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                          )}
                        >
                          {msg.body}
                          <p className={cn("text-[10px] mt-0.5", isMine ? "text-white/60 text-right" : "text-gray-400")}>
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Composer */}
                <div className="border-t border-gray-200 p-3 bg-white flex items-end gap-2">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${activeOtherUser.display_name || ""}...`}
                    rows={1}
                    className="flex-1 resize-none bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg px-3.5 py-2.5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 overflow-y-auto"
                    style={{ minHeight: 40 }}
                  />
                  <button
                    onClick={send}
                    disabled={!text.trim() || sendMessage.isPending}
                    aria-label="Send message"
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    {sendMessage.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </>
            ) : (
              <EmptyState
                icon={<MessageCircle size={32} />}
                title="Select a conversation"
                description="Choose from the list on the left or start a new one from someone's profile."
                className="flex-1"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
