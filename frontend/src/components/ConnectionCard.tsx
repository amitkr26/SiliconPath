"use client";

import Link from "next/link";
import { UserCheck, UserPlus, MessageCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ConnectionCardProps {
  id: string;
  name: string;
  username?: string;
  headline?: string;
  avatarUrl?: string;
  mutualConnections?: number;
  connectedAt?: string;
  isPending?: boolean;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onConnect?: (id: string) => void;
  onMessage?: (username: string) => void;
}

export default function ConnectionCard({
  id,
  name,
  username,
  headline,
  avatarUrl,
  mutualConnections,
  connectedAt,
  isPending,
  onAccept,
  onDecline,
  onConnect,
  onMessage,
}: ConnectionCardProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:shadow-[var(--shadow-sm)] transition-shadow">
      {/* Avatar */}
      <Link href={username ? `/profile/${username}` : "#"} className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-12 h-12 rounded-full object-cover border border-[var(--border-subtle)]"
          />
        ) : (
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-semibold text-sm">
            {initials}
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={username ? `/profile/${username}` : "#"}
          className="font-semibold text-sm text-[var(--text)] hover:text-[var(--primary)] transition-colors line-clamp-1"
        >
          {name}
        </Link>
        {headline && (
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5">{headline}</p>
        )}
        {mutualConnections != null && mutualConnections > 0 && (
          <p className="text-xs text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
            <UserCheck size={11} />
            {mutualConnections} mutual connection{mutualConnections !== 1 ? "s" : ""}
          </p>
        )}
        {connectedAt && (
          <p className="text-xs text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
            <Clock size={11} />
            Connected {formatDistanceToNow(new Date(connectedAt), { addSuffix: true })}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        {isPending ? (
          <>
            <button
              onClick={() => onAccept?.(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors min-h-[36px]"
            >
              <UserCheck size={13} /> Accept
            </button>
            <button
              onClick={() => onDecline?.(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs font-medium hover:bg-[var(--surface-raised)] transition-colors min-h-[36px]"
            >
              Decline
            </button>
          </>
        ) : onConnect ? (
          <button
            onClick={() => onConnect(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--primary)] text-[var(--primary)] text-xs font-medium hover:bg-[var(--primary-light)] transition-colors min-h-[36px]"
          >
            <UserPlus size={13} /> Connect
          </button>
        ) : onMessage && username ? (
          <button
            onClick={() => onMessage(username)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs font-medium hover:bg-[var(--surface-raised)] transition-colors min-h-[36px]"
          >
            <MessageCircle size={13} /> Message
          </button>
        ) : null}
      </div>
    </div>
  );
}
