"use client";

import { useRef, useEffect, KeyboardEvent } from "react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Loader2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  text: string;
  onTextChange: (val: string) => void;
  onSend: () => void;
  isSending?: boolean;
  className?: string;
}

function initials(name?: string): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

export default function MessageThread({
  messages,
  currentUserId,
  otherUserName,
  otherUserAvatar,
  text,
  onTextChange,
  onSend,
  isSending = false,
  className = "",
}: MessageThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) onSend();
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-slate-500 font-medium">
              Start a conversation with {otherUserName || "this person"}.
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar (other only) */}
              {!isMine && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-blue-600 text-xs font-bold overflow-hidden relative">
                  <ImageWithFallback
                    src={otherUserAvatar}
                    alt={otherUserName || "User"}
                    fallbackType="avatar"
                    fallbackName={otherUserName || "User"}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Bubble */}
              <div
                className={cn(
                  "max-w-[72%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words",
                  isMine
                    ? "bg-blue-600 text-white rounded-br-sm border-2 border-slate-900 shadow-brutal-sm"
                    : "bg-white text-slate-900 rounded-bl-sm border-2 border-slate-900",
                )}
              >
                {msg.body}
                <p className={cn("text-[10px] mt-0.5", isMine ? "text-white/60 text-right" : "text-slate-400 font-medium")}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t-2 border-slate-900 p-3 flex items-end gap-2 bg-white">
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${otherUserName || ""}…`}
          rows={1}
          className="flex-1 resize-none bg-white border-2 border-slate-900 text-slate-900 text-sm font-medium rounded-xl px-3.5 py-2.5 placeholder:text-slate-400 shadow-brutal-sm focus:outline-none focus:border-accent focus:shadow-brutal transition max-h-32 overflow-y-auto"
          style={{ minHeight: 44 }}
        />
        <button
          onClick={onSend}
          disabled={!text.trim() || isSending}
          aria-label="Send message"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700 border-2 border-slate-900 shadow-brutal-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}