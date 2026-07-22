"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MessageCircle, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useConversations, useConversationMessages, useSendMessage } from "@/hooks/useMessages";
import MessageThread from "@/components/MessageThread";
import EmptyState from "@/components/shared/EmptyState";
import { formatDistanceToNow } from "date-fns";

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
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");

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
        onError: () => toast.error("Failed to send message"),
      }
    );
  };

  if (userLoading || convLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle size={24} className="text-[var(--primary)]" />
          <h1 className="text-2xl font-bold text-[var(--text)]">Messages</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4" style={{ height: "70vh" }}>
          {/* Conversation list */}
          <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-col overflow-hidden ${activeConv ? "hidden md:flex" : "flex"}`}>
            {/* Search */}
            <div className="p-3 border-b border-[var(--border)]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={<MessageCircle size={24} />}
                  title="No conversations"
                  description="Start a conversation from a connection's profile."
                />
              ) : (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveConv(c.id)}
                      className={[
                        "w-full flex items-start gap-3 p-3 text-left transition-colors",
                        activeConv === c.id
                          ? "bg-[var(--primary-light)]"
                          : "hover:bg-[var(--surface-raised)]",
                      ].join(" ")}
                    >
                      <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {c.other_user?.avatar_url ? (
                          <img src={c.other_user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : initials(c.other_user?.display_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-1">
                          <span className="text-sm font-medium text-[var(--text)] truncate">
                            {c.other_user?.display_name || "Member"}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0">
                            {c.last_message_at
                              ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false })
                              : ""}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{c.last_message_preview}</p>
                      </div>
                      {c.unread_count > 0 && (
                        <span className="bg-[var(--primary)] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 flex-shrink-0">
                          {c.unread_count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-col overflow-hidden ${activeConv ? "flex" : "hidden md:flex"}`}>
            {active ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                  <button
                    onClick={() => setActiveConv(null)}
                    className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                    aria-label="Back"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {active.other_user?.avatar_url ? (
                      <img src={active.other_user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : initials(active.other_user?.display_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)] truncate">
                      {active.other_user?.display_name || "Member"}
                    </p>
                    {active.other_user?.headline && (
                      <p className="text-xs text-[var(--text-secondary)] truncate">{active.other_user.headline}</p>
                    )}
                  </div>
                </div>

                {/* MessageThread component */}
                <MessageThread
                  messages={messages}
                  currentUserId={user?.id ?? ""}
                  otherUserName={active.other_user?.display_name ?? undefined}
                  otherUserAvatar={active.other_user?.avatar_url ?? undefined}
                  text={text}
                  onTextChange={setText}
                  onSend={send}
                  isSending={sendMessage.isPending}
                  className="flex-1 overflow-hidden"
                />
              </>
            ) : (
              <EmptyState
                icon={<MessageCircle size={28} />}
                title="Select a conversation"
                description="Choose from the list or start one from a connection's profile."
                className="flex-1"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
