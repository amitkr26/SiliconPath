"use client";

import { useState } from "react";
import Link from "next/link";
import { ThumbsUp, MessageCircle, Repeat2, MoreHorizontal, Trash2, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Dropdown from "./shared/Dropdown";

interface FeedPostProps {
  id: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string;
  authorHeadline?: string;
  content: string;
  likeCount?: number;
  commentCount?: number;
  repostCount?: number;
  isLiked?: boolean;
  createdAt: string;
  opportunity?: { id: string; slug?: string; title: string; org?: string };
  currentUserId?: string;
  authorId?: string;
  onLike?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function FeedPost({
  id,
  authorName,
  authorUsername,
  authorAvatar,
  authorHeadline,
  content,
  likeCount = 0,
  commentCount = 0,
  repostCount = 0,
  isLiked = false,
  createdAt,
  opportunity,
  currentUserId,
  authorId,
  onLike,
  onDelete,
}: FeedPostProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);

  const initials = authorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleLike = () => {
    setLiked((l) => !l);
    setLikes((c) => (liked ? c - 1 : c + 1));
    onLike?.(id);
  };

  const isOwner = currentUserId && authorId && currentUserId === authorId;

  return (
    <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3 hover:shadow-[var(--shadow-sm)] transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <Link href={authorUsername ? `/profile/${authorUsername}` : "#"} className="flex-shrink-0">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-10 h-10 rounded-full object-cover border border-[var(--border-subtle)]" />
            ) : (
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-semibold text-sm">
                {initials}
              </span>
            )}
          </Link>
          <div className="min-w-0">
            <Link
              href={authorUsername ? `/profile/${authorUsername}` : "#"}
              className="font-semibold text-sm text-[var(--text)] hover:text-[var(--primary)] transition-colors"
            >
              {authorName}
            </Link>
            {authorHeadline && (
              <p className="text-xs text-[var(--text-secondary)] line-clamp-1">{authorHeadline}</p>
            )}
            <p className="text-xs text-[var(--text-tertiary)]">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {isOwner && onDelete && (
          <Dropdown
            trigger={<MoreHorizontal size={18} className="text-[var(--text-tertiary)]" />}
            items={[{ label: "Delete post", value: "delete", icon: <Trash2 size={14} />, danger: true }]}
            onSelect={() => onDelete(id)}
            align="right"
          />
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">{content}</p>

      {/* Linked opportunity */}
      {opportunity && (
        <Link
          href={opportunity.slug ? `/opportunities/${opportunity.slug}` : `/opportunities/${opportunity.id}`}
          className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--primary)] transition-colors group"
        >
          <Briefcase size={16} className="text-[var(--text-tertiary)] group-hover:text-[var(--primary)] transition-colors" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--text)] line-clamp-1">{opportunity.title}</p>
            {opportunity.org && <p className="text-xs text-[var(--text-tertiary)]">{opportunity.org}</p>}
          </div>
        </Link>
      )}

      {/* Engagement bar */}
      <div className="flex items-center gap-1 pt-1 border-t border-[var(--border-subtle)]">
        <button
          onClick={handleLike}
          aria-pressed={liked}
          className={[
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px]",
            liked
              ? "text-[var(--primary)] bg-[var(--primary-light)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]",
          ].join(" ")}
        >
          <ThumbsUp size={14} className={liked ? "fill-current" : ""} />
          {likes > 0 && <span>{likes}</span>}
          <span className="hidden sm:inline">Like</span>
        </button>

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] transition-colors min-h-[36px]">
          <MessageCircle size={14} />
          {commentCount > 0 && <span>{commentCount}</span>}
          <span className="hidden sm:inline">Comment</span>
        </button>

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] transition-colors min-h-[36px]">
          <Repeat2 size={14} />
          {repostCount > 0 && <span>{repostCount}</span>}
          <span className="hidden sm:inline">Repost</span>
        </button>
      </div>
    </article>
  );
}
