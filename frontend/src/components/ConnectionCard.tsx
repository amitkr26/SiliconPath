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
      className="bg-white border-3 border-slate-900 rounded-2xl p-4 shadow-[4px_4px_0px_0px_#0F172A] flex items-start justify-between gap-3 hover:shadow-[6px_6px_0px_0px_#0F172A] transition-all cursor-pointer"
    >
      {/* Avatar & Info */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <Link href={username ? `/profile/${username}` : "#"} className="shrink-0">
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarUrl}
              alt={name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
            />
          ) : (
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-sm border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]">
              {initials}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1 space-y-0.5">
          <Link
            href={username ? `/profile/${username}` : "#"}
            className="font-black text-sm text-slate-900 hover:text-blue-600 transition-colors truncate block"
          >
            {name}
          </Link>
          {headline && (
            <p className="text-xs font-bold text-slate-600 line-clamp-2 leading-tight">{headline}</p>
          )}
          {mutualConnections != null && mutualConnections > 0 && (
            <p className="text-[11px] font-extrabold text-blue-600 mt-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              {mutualConnections} mutual hardware connection{mutualConnections !== 1 ? "s" : ""}
            </p>
          )}
          {connectedAt && (
            <p className="text-[11px] font-bold text-slate-500 mt-1 flex items-center gap-1">
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
            <button
              onClick={(e) => { e.stopPropagation(); onAccept?.(id); }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A] transition"
            >
              Accept
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDecline?.(id); }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A] transition"
            >
              Decline
            </button>
          </>
        ) : onConnect ? (
          <button
            onClick={(e) => { e.stopPropagation(); onConnect(id); }}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black border-2 border-slate-900 shadow-[2.5px_2.5px_0px_0px_#0F172A] transition flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" /> Connect
          </button>
        ) : onMessage ? (
          <button
            onClick={(e) => { e.stopPropagation(); onMessage(username || id); }}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black border-2 border-slate-900 shadow-[2.5px_2.5px_0px_0px_#0F172A] transition flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5 stroke-[2.5]" /> Message
          </button>
        ) : null}
      </div>
    </div>
  );
}
