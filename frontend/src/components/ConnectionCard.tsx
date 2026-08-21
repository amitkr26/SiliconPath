"use client";

import Link from "next/link";
import { UserCheck, UserPlus, MessageCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ConnectionCardProps {
  id: string;
  name: string;
  username?: string;
  headline?: string;
  avatarUrl?: string;
  mutualConnections?: number;
  connectedAt?: string;
  isPending?: boolean;
  onOpen?: () => void;
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
  onOpen,
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
    <div
      onClick={() => onOpen?.()}
      className={cn(
        "bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-card flex items-start justify-between gap-3 hover:shadow-elevated hover:-translate-y-0.5 transition-all cursor-pointer",
      )}
    >
      {/* Avatar & Info */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <Link href={username ? `/profile/${username}` : "#"} className="shrink-0">
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarUrl}
              alt={name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-slate-900 shadow-card-sm"
            />
          ) : (
            <span className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl border-2 border-slate-900 shadow-card-sm",
              "bg-primary text-inverted text-sm"
            )}>
              {initials}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1 space-y-0.5">
          <Link
            href={username ? `/profile/${username}` : "#"}
            className="font-semibold text-sm text-slate-900 hover:text-primary transition-colors truncate block"
          >
            {name}
          </Link>
          {headline && (
            <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-tight">{headline}</p>
          )}
          {mutualConnections != null && mutualConnections > 0 && (
            <p className="text-[11px] font-bold text-blue-600 mt-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              {mutualConnections} mutual hardware connection{mutualConnections !== 1 ? "s" : ""}
            </p>
          )}
          {connectedAt && (
            <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Connected {formatDistanceToNow(new Date(connectedAt), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex flex-col gap-1.5">
        {isPending ? (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onAccept?.(id); }}
            >
              Accept
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDecline?.(id); }}
            >
              Decline
            </Button>
          </>
        ) : onConnect ? (
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); onConnect(id); }}
          >
            <UserPlus className="w-3.5 h-3.5" /> Connect
          </Button>
        ) : onMessage ? (
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); onMessage(username || id); }}
          >
            <MessageCircle className="w-3.5 h-3.5" /> Message
          </Button>
        ) : null}
      </div>
    </div>
  );
}