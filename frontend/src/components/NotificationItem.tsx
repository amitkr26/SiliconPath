import { Bell, UserPlus, UserCheck, Heart, MessageCircle, Repeat2, Award, Star, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type NotificationType =
  | "connection_request"
  | "connection_accepted"
  | "post_like"
  | "post_comment"
  | "post_repost"
  | "achievement"
  | "mention"
  | "job_match"
  | "message"
  | "system";

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  actorName?: string;
  actorAvatar?: string;
  actorUsername?: string;
  href?: string;
  onMarkRead?: (id: string) => void;
}

const ICON_MAP: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  connection_request: { icon: UserPlus, color: "text-[var(--primary)]" },
  connection_accepted: { icon: UserCheck, color: "text-[var(--accent-green)]" },
  post_like: { icon: Heart, color: "text-rose-500" },
  post_comment: { icon: MessageCircle, color: "text-[var(--primary)]" },
  post_repost: { icon: Repeat2, color: "text-[var(--accent-purple)]" },
  achievement: { icon: Award, color: "text-[var(--accent-amber)]" },
  mention: { icon: Star, color: "text-[var(--accent-amber)]" },
  job_match: { icon: Briefcase, color: "text-[var(--accent-green)]" },
  message: { icon: MessageCircle, color: "text-[var(--primary)]" },
  system: { icon: Bell, color: "text-[var(--text-tertiary)]" },
};

export default function NotificationItem({
  id,
  type,
  message,
  isRead,
  createdAt,
  actorName,
  actorAvatar,
  actorUsername,
  href,
  onMarkRead,
}: NotificationItemProps) {
  const { icon: Icon, color } = ICON_MAP[type] ?? ICON_MAP.system;
  const initials = actorName
    ? actorName.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()
    : "?";

  const inner = (
    <div
      className={[
        "flex items-start gap-3 p-4 transition-colors",
        isRead ? "opacity-70" : "bg-[var(--primary-light)]/30",
        href ? "hover:bg-[var(--surface-raised)] cursor-pointer" : "",
      ].join(" ")}
      onClick={() => !isRead && onMarkRead?.(id)}
    >
      {/* Actor or icon */}
      <div className="relative flex-shrink-0">
        {actorAvatar ? (
          <img src={actorAvatar} alt={actorName} className="w-10 h-10 rounded-full object-cover" />
        ) : actorName ? (
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface-raised)] text-[var(--text-secondary)] font-semibold text-sm">
            {initials}
          </span>
        ) : (
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface-raised)]">
            <Icon size={18} className={color} />
          </span>
        )}
        {actorName && (
          <span className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-[var(--surface)] border border-[var(--border)] ${color}`}>
            <Icon size={11} />
          </span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${isRead ? "text-[var(--text-secondary)]" : "text-[var(--text)]"}`}>
          {actorUsername ? (
            <>
              <Link href={`/profile/${actorUsername}`} className="font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>
                {actorName}
              </Link>{" "}
              {message}
            </>
          ) : message}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Unread dot */}
      {!isRead && (
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--primary)] mt-1.5" aria-label="Unread" />
      )}
    </div>
  );

  return href ? <Link href={href} className="block">{inner}</Link> : <div>{inner}</div>;
}
