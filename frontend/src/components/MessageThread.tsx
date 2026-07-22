"use client";

import { useRef, useEffect, KeyboardEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--text-tertiary)]">
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
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] text-xs font-semibold">
                  {otherUserAvatar ? (
                    <img src={otherUserAvatar} alt={otherUserName} className="w-7 h-7 rounded-full object-cover" />
                  ) : initials(otherUserName)}
                </div>
              )}

              {/* Bubble */}
              <div
                className={[
                  "max-w-[72%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words",
                  isMine
                    ? "bg-[var(--primary)] text-white rounded-br-sm"
                    : "bg-[var(--surface-raised)] text-[var(--text)] rounded-bl-sm border border-[var(--border-subtle)]",
                ].join(" ")}
              >
                {msg.body}
                <p className={`text-[10px] mt-0.5 ${isMine ? "text-white/60 text-right" : "text-[var(--text-tertiary)]"}`}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] p-3 flex items-end gap-2 bg-[var(--surface)]">
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${otherUserName || ""}…`}
          rows={1}
          className="flex-1 resize-none bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none transition max-h-32 overflow-y-auto"
          style={{ minHeight: 44 }}
        />
        <button
          onClick={onSend}
          disabled={!text.trim() || isSending}
          aria-label="Send message"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
