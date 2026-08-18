"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, MessageCircle, Search, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useConversations, useConversationMessages, useSendMessage } from "@/hooks/useMessages";
import MessageThread from "@/components/MessageThread";
import EmptyState from "@/components/shared/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";

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

  // Handle URL query parameters: ?conv= or ?user=
  useEffect(() => {
    const convParam = searchParams.get("conv");
    const userParam = searchParams.get("user");

    if (convParam) {
      setActiveConv(convParam);
      setTargetUser(null);
      return;
    }

    if (userParam && user) {
      // Check if conversation already exists with this user
      const existing = conversations.find((c) => c.other_user?.id === userParam);
      if (existing) {
        setActiveConv(existing.id);
        setTargetUser(null);
      } else {
        // Fetch target user details from user_profiles to allow starting a new thread
        createClient()
          .from("user_profiles")
          .select("id, display_name, avatar_url, headline")
          .or(`id.eq.${userParam},username.eq.${userParam}`)
          .maybeSingle()
          .then((res: any) => {
            const data = res?.data;
            if (data) {
              setTargetUser({
                id: data.id,
                display_name: data.display_name || "Hardware Member",
                avatar_url: data.avatar_url,
                headline: data.headline,
              });
              setActiveConv(null);
            }
          });
      }
    }
  }, [searchParams, conversations, user]);

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

  if (userLoading || convLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-6 px-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-white shadow-[2.5px_2.5px_0px_0px_#0F172A]">
            <MessageCircle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Direct Messages</h1>
            <p className="text-xs text-slate-600 font-bold">Private messaging with hardware engineers &amp; researchers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4" style={{ height: "72vh" }}>
          {/* CONVERSATION LIST */}
          <div className={`bg-white border-3 border-slate-900 rounded-2xl flex flex-col overflow-hidden shadow-[5px_5px_0px_0px_#0F172A] ${activeConv || targetUser ? "hidden md:flex" : "flex"}`}>
            {/* SEARCH BAR */}
            <div className="p-3 border-b-2 border-slate-900 bg-slate-50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 stroke-[2.5]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full bg-white border-2 border-slate-900 text-slate-900 text-xs font-bold rounded-xl pl-9 pr-3 py-2 outline-none focus:shadow-[2px_2px_0px_0px_#0F172A] transition"
                />
              </div>
            </div>

            {/* LIST ITEMS */}
            <div className="flex-1 overflow-y-auto divide-y-2 divide-slate-100">
              {filtered.length === 0 && !targetUser ? (
                <EmptyState
                  icon={<MessageCircle size={24} />}
                  title="No conversations yet"
                  description="Start a direct message from any member's profile or network request."
                />
              ) : (
                <>
                  {targetUser && !activeConv && (
                    <div className="p-3 bg-blue-50 border-b-2 border-slate-900 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center border border-slate-900">
                        {initials(targetUser.display_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 truncate">{targetUser.display_name}</p>
                        <span className="text-[10px] font-bold text-blue-700">New Conversation</span>
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
                      className={`w-full flex items-start gap-3 p-3.5 text-left transition-colors ${
                        activeConv === c.id ? "bg-blue-50 font-black border-l-4 border-blue-600" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 border border-slate-900 shadow-[1.5px_1.5px_0px_0px_#0F172A]">
                        {c.other_user?.avatar_url ? (
                          <Image src={c.other_user.avatar_url} alt="" width={40} height={40} className="w-10 h-10 rounded-xl object-cover" unoptimized />
                        ) : (
                          initials(c.other_user?.display_name)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-1">
                          <span className="text-xs font-black text-slate-900 truncate">
                            {c.other_user?.display_name || "Hardware Member"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0">
                            {c.last_message_at
                              ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false })
                              : ""}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-600 truncate mt-0.5">{c.last_message_preview}</p>
                      </div>
                      {c.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-[10px] font-black rounded-full px-2 py-0.5 shrink-0 border border-slate-900">
                          {c.unread_count}
                        </span>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* CHAT AREA */}
          <div className={`bg-white border-3 border-slate-900 rounded-2xl flex flex-col overflow-hidden shadow-[5px_5px_0px_0px_#0F172A] ${activeConv || targetUser ? "flex" : "hidden md:flex"}`}>
            {activeOtherUser ? (
              <>
                {/* CHAT HEADER */}
                <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-slate-900 bg-slate-50">
                  <button
                    onClick={() => {
                      setActiveConv(null);
                      setTargetUser(null);
                    }}
                    className="md:hidden p-1 text-slate-900 hover:bg-slate-200 rounded-lg"
                    aria-label="Back"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 border border-slate-900 shadow-[1.5px_1.5px_0px_0px_#0F172A]">
                    {activeOtherUser.avatar_url ? (
                      <Image src={activeOtherUser.avatar_url} alt="" width={36} height={36} className="w-9 h-9 rounded-xl object-cover" unoptimized />
                    ) : (
                      initials(activeOtherUser.display_name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {activeOtherUser.display_name || "Hardware Member"}
                    </p>
                    {activeOtherUser.headline && (
                      <p className="text-[10px] font-bold text-slate-500 truncate">{activeOtherUser.headline}</p>
                    )}
                  </div>
                </div>

                {/* THREAD MESSAGES */}
                <MessageThread
                  messages={messages}
                  currentUserId={user?.id ?? ""}
                  otherUserName={activeOtherUser.display_name ?? undefined}
                  otherUserAvatar={activeOtherUser.avatar_url ?? undefined}
                  text={text}
                  onTextChange={setText}
                  onSend={send}
                  isSending={sendMessage.isPending}
                  className="flex-1 overflow-hidden"
                />
              </>
            ) : (
              <EmptyState
                icon={<MessageCircle size={32} />}
                title="Select a conversation"
                description="Choose from the conversation list on the left or click 'Message' from any candidate's profile."
                className="flex-1"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
