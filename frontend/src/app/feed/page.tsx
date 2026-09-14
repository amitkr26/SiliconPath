"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Send, ThumbsUp, MessageCircle, Repeat2, Trash2, Users, Briefcase,
  Sparkles, Tag, Check, Edit2, X, Bookmark, Newspaper, Code, Award, ExternalLink, Share2
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useFeed, useCreatePost, useLikePost, useRepostFeedPost } from "@/hooks/useFeed";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { FeedPost } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { cn } from "@/lib/utils";

interface Opp {
  id: string;
  slug?: string;
  title: string;
  organizations?: { name?: string } | null;
}

interface CommentItem {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_profile?: {
    display_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  } | null;
}

const TOPIC_TAGS = [
  { id: "#RTL_Design", label: "#RTL_Design" },
  { id: "#Verification_UVM", label: "#Verification_UVM" },
  { id: "#Physical_Design", label: "#Physical_Design" },
  { id: "#Research_JRF", label: "#Research_JRF" },
  { id: "#Embedded_Systems", label: "#Embedded_Systems" },
];

const ALL_TAGS = [
  { id: "all", label: "All Discussions" },
  ...TOPIC_TAGS,
  { id: "#STA_Timing", label: "#STA_Timing" },
  { id: "#Career_Milestone", label: "#Career_Milestone" },
];

function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString();
}

function PostSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-slate-200 rounded w-1/3" />
          <div className="h-2.5 bg-slate-100 rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-4/5" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
      </div>
      <div className="flex gap-4 pt-2">
        <div className="h-8 bg-slate-100 rounded w-16" />
        <div className="h-8 bg-slate-100 rounded w-20" />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 animate-pulse">
      <div className="w-14 h-14 rounded-full bg-slate-200 mx-auto" />
      <div className="h-3 bg-slate-200 rounded w-2/3 mx-auto" />
      <div className="h-2.5 bg-slate-100 rounded w-1/2 mx-auto" />
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const { user, displayName: userDisplayName, username: currentUsername, loading: userLoading } = useUser();
  const { data: feedData, isLoading: feedLoading, refetch: refetchFeed, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed(30);
  const createPost = useCreatePost();
  const likePost = useLikePost();
  const repostPost = useRepostFeedPost();
  const [content, setContent] = useState("");
  const [activeTag, setActiveTag] = useState("all");
  const [opps, setOpps] = useState<Opp[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, CommentItem[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  const allPosts = feedData?.pages.flatMap((p) => p.posts) ?? [];
  const posts = activeTag === "all"
    ? allPosts
    : allPosts.filter((p) => (p.content || "").toLowerCase().includes(activeTag.toLowerCase()));

  const displayName =
    userDisplayName ||
    (user as any)?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Engineer";

  const headline =
    (user as any)?.user_metadata?.headline ||
    "Semiconductor & VLSI Researcher";

  const loadSidebarData = useCallback(async () => {
    try {
      const [oppRes, newsRes] = await Promise.all([
        fetch("/api/opportunities?limit=3"),
        fetch("/api/news?limit=3"),
      ]);
      if (oppRes.ok) {
        const data = await oppRes.json();
        setOpps((data.opportunities || []).slice(0, 3));
      }
      if (newsRes.ok) {
        const data = await newsRes.json();
        setNews((data.articles || data.news || []).slice(0, 3));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login?redirectTo=/feed");
      return;
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    loadSidebarData();
  }, [loadSidebarData]);

  // Infinite scroll: load more posts when sentinel is visible
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchNextPage(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    createPost.mutate(content, {
      onSuccess: () => {
        setContent("");
        toast.success("Posted to professional feed!");
      },
      onError: () => {
        toast.error("Failed to post");
      },
    });
  };

  const handleAddTag = (tag: string) => {
    if (content.includes(tag)) return;
    setContent((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  const like = (postId: string) => {
    likePost.mutate(postId);
  };

  const remove = async (postId: string) => {
    try {
      await api.delete(`/api/feed/posts/${postId}`);
      toast.success("Post deleted");
      refetchFeed();
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const startEdit = (post: FeedPost) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const saveEdit = async (postId: string) => {
    if (!editContent.trim()) return;
    try {
      await api.patch(`/api/feed/posts/${postId}`, { content: editContent });
      toast.success("Post updated!");
      setEditingPostId(null);
      refetchFeed();
    } catch {
      toast.error("Failed to update post");
    }
  };

  const toggleComments = async (postId: string) => {
    const isNowExpanded = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: isNowExpanded }));

    if (isNowExpanded && !postComments[postId]) {
      try {
        const res = await fetch(`/api/feed/posts/${postId}/comment`);
        if (res.ok) {
          const data = await res.json();
          setPostComments((prev) => ({ ...prev, [postId]: data.comments || [] }));
        }
      } catch {
        /* ignore */
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/feed/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setPostComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment],
        }));
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        toast.success("Comment added!");
      } else {
        toast.error("Failed to add comment");
      }
    } catch {
      toast.error("Failed to add comment");
    }
    setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
  };

  const togglePostExpansion = (postId: string) => {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const deleteComment = async (postId: string, commentId: string) => {
    try {
      await api.delete(`/api/feed/posts/${postId}/comment?commentId=${commentId}`);
      setPostComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
      }));
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px] gap-6">

          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block space-y-4 sticky top-20 self-start">
            {/* Profile Card */}
            <Card tone="flat" className="p-5">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto relative border border-slate-200 shadow-xs">
                  <ImageWithFallback
                    src={(user as any)?.avatar_url || (user as any)?.user_metadata?.avatar_url}
                    alt={displayName}
                    fallbackType="avatar"
                    fallbackName={displayName}
                    fill
                    className="object-cover"
                  />
                </div>
                <Link href={currentUsername ? `/profile/${currentUsername}` : "/profile"} className="block mt-3 font-semibold text-sm text-slate-900 hover:text-blue-600 transition-colors truncate">
                  {displayName}
                </Link>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{headline}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold text-slate-900">26</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Views</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{feedData?.pages?.[0]?.posts?.length || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Posts</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-600">Active</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Network</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <Link href="/saved" className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors py-1">
                  <Bookmark className="w-3.5 h-3.5" /> Saved Opportunities
                </Link>
                <Link href="/applications" className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors py-1">
                  <Briefcase className="w-3.5 h-3.5" /> My Applications
                </Link>
              </div>
            </Card>

            {/* Topic Shortcuts */}
            <Card tone="flat" className="p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Topics</h3>
              <div className="space-y-1">
                {TOPIC_TAGS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTag(t.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                      activeTag === t.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Card>
          </aside>

          {/* CENTER: Feed */}
          <div className="space-y-4 min-w-0">
            {/* Tag Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-none">
              {ALL_TAGS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTag(t.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                    activeTag === t.id
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Composer */}
            <Card tone="flat" className="p-5">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {initials(displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share a technical update, RTL project, research finding, or career milestone..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-3.5 py-2.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                  />

                  {/* Tag Shortcuts */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Quick Tags:
                    </span>
                    {TOPIC_TAGS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleAddTag(t.id)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-[10px] font-medium rounded-full transition-colors"
                      >
                        {t.id}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {content.length > 0 ? `${content.length} chars` : ""}
                      </span>
                    </div>
                    <Button
                      onClick={handleSubmit}
                      disabled={createPost.isPending || !content.trim()}
                      size="sm"
                    >
                      {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Loading State */}
            {feedLoading && (
              <div className="space-y-4">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </div>
            )}

            {/* Empty State */}
            {!feedLoading && posts.length === 0 && (
              <Card tone="flat" className="p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-700 font-semibold text-sm">No posts yet. Be the first to share a semiconductor insight!</p>
                <p className="text-slate-500 text-xs mt-1">
                  Share your RTL discoveries, verification breakthroughs, or career milestones.
                </p>
                <Button
                  onClick={() => setContent(`${activeTag !== "all" ? activeTag : "#RTL_Design"} `)}
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                >
                  Create Post
                </Button>
              </Card>
            )}

            {/* Posts Feed */}
            {!feedLoading && posts.length > 0 && (
              <div className="space-y-3">
                {posts.map((post: FeedPost) => {
                  const isAuthor = post.user_id === user?.id || (post as any).author_id === user?.id;
                  const authorUsername = (post.author as any)?.username || (post as any).user_profile?.username || post.user_id;
                  const isEditing = editingPostId === post.id;
                  const isCommentsOpen = !!expandedComments[post.id];
                  const comments = postComments[post.id] || [];
                  const isExpanded = expandedPosts[post.id];
                  const shouldTruncate = post.content.length > 280 && !isExpanded;

                  return (
                    <Card key={post.id} tone="flat" className="p-5">
                      {/* Author Header */}
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={authorUsername ? `/profile/${authorUsername}` : "#"}
                          className="flex items-center gap-3 min-w-0 group"
                        >
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 overflow-hidden relative border border-slate-200">
                            <ImageWithFallback
                              src={post.author?.avatar_url || (post as any).user_profile?.avatar_url}
                              alt={post.author?.display_name || (post as any).user_profile?.display_name || "User avatar"}
                              fallbackType="avatar"
                              fallbackName={post.author?.display_name || (post as any).user_profile?.display_name || "User"}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {post.author?.display_name || (post as any).user_profile?.display_name || "Semiconductor Engineer"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(post.author?.headline || (post as any).user_profile?.headline) ? `${post.author?.headline || (post as any).user_profile?.headline} · ` : ""}
                              {timeAgo(post.created_at)}
                            </p>
                          </div>
                        </Link>

                        {isAuthor && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(post)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50"
                              title="Edit post"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => remove(post.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                              title="Delete post"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Post Content / Edit Mode */}
                      {isEditing ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingPostId(null)}>
                              Cancel
                            </Button>
                            <Button size="sm" onClick={() => saveEdit(post.id)}>
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <p className={cn(
                            "text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed",
                            shouldTruncate && "line-clamp-4"
                          )}>
                            {post.content}
                          </p>
                          {shouldTruncate && (
                            <button
                              onClick={() => togglePostExpansion(post.id)}
                              className="text-xs text-blue-600 font-medium mt-1 hover:underline"
                            >
                              Read more
                            </button>
                          )}
                          {isExpanded && post.content.length > 280 && (
                            <button
                              onClick={() => togglePostExpansion(post.id)}
                              className="text-xs text-blue-600 font-medium mt-1 hover:underline"
                            >
                              Show less
                            </button>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {post.tags.map((tag: string) => (
                            <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions Bar */}
                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => like(post.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            post.user_reaction
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                          )}
                        >
                          <ThumbsUp className={cn("w-3.5 h-3.5", post.user_reaction && "fill-current")} />
                          <span>{post.likes_count || 0}</span>
                        </button>

                        <button
                          onClick={() => toggleComments(post.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            isCommentsOpen
                              ? "bg-slate-100 text-slate-700"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                          )}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{post.comments_count || comments.length || 0}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              const shareUrl = `${window.location.origin}/feed?post=${post.id}`;
                              navigator.clipboard.writeText(shareUrl).then(() => {
                                toast.success("Post link copied to clipboard!");
                              }).catch(() => {
                                toast.info(shareUrl);
                              });
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                          title="Share post"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </button>

                        <button
                          onClick={() => repostPost.mutate({ postId: post.id })}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                          )}
                          title="Repost"
                        >
                          <Repeat2 className="w-3.5 h-3.5" />
                          <span>{post.reposts_count || 0}</span>
                        </button>
                      </div>

                      {/* Expandable Comments */}
                      {isCommentsOpen && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                          {/* Add Comment */}
                          <div className="flex gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                              {initials(displayName)}
                            </div>
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                placeholder="Write a constructive technical comment..."
                                value={commentInputs[post.id] || ""}
                                onChange={(e) =>
                                  setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(post.id);
                                  }
                                }}
                                className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleAddComment(post.id)}
                                disabled={submittingComment[post.id] || !commentInputs[post.id]?.trim()}
                                className="text-xs px-3"
                              >
                                {submittingComment[post.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reply"}
                              </Button>
                            </div>
                          </div>

                          {/* Comments List */}
                          {comments.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-1">No comments yet. Start the conversation!</p>
                          ) : (
                            <div className="space-y-2">
                              {comments.map((c) => (
                                <div key={c.id} className="flex gap-2 group/comment">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0 overflow-hidden relative border border-slate-200">
                                    <ImageWithFallback
                                      src={c.user_profile?.avatar_url}
                                      alt={c.user_profile?.display_name || "User"}
                                      fallbackType="avatar"
                                      fallbackName={c.user_profile?.display_name || "User"}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Link
                                        href={c.user_profile?.username ? `/profile/${c.user_profile.username}` : "#"}
                                        className="text-xs font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                                      >
                                        {c.user_profile?.display_name || "Engineer"}
                                      </Link>
                                      <span className="text-[10px] text-slate-400">{timeAgo(c.created_at)}</span>
                                      {c.user_id === user?.id && (
                                        <button
                                          onClick={() => deleteComment(post.id, c.id)}
                                          className="ml-auto p-0.5 text-slate-300 hover:text-red-500 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                                          title="Delete comment"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed mt-0.5">{c.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="hidden xl:block space-y-4 sticky top-20 self-start">
            {/* Semiconductor News */}
            <Card tone="flat" className="p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Newspaper className="w-3.5 h-3.5" /> Semiconductor News
              </h3>
              <div className="space-y-3">
                {news.length === 0 ? (
                  <p className="text-xs text-slate-400">Loading latest news...</p>
                ) : (
                  news.map((item) => (
                    <Link key={item.id} href={`/news/${item.slug || item.id}`} className="block group">
                      <p className="text-xs font-medium text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {item.source_name || "Semiconductor Daily"} · {timeAgo(item.published_at || item.created_at)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
              <Link href="/news" className="inline-block text-xs text-blue-600 font-medium hover:underline mt-3">
                View all news
              </Link>
            </Card>

            {/* Trending Opportunities */}
            <Card tone="flat" className="p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" /> Trending Opportunities
              </h3>
              <div className="space-y-3">
                {opps.length === 0 ? (
                  <p className="text-xs text-slate-400">No opportunities yet</p>
                ) : (
                  opps.map((o) => (
                    <Link
                      key={o.id}
                      href={o.slug ? `/opportunities/${o.slug}` : "/opportunities"}
                      className="block group"
                    >
                      <p className="text-xs font-medium text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {o.title}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{(o as any).organization || o.organizations?.name || "Verified Technical Org"}</p>
                    </Link>
                  ))
                )}
              </div>
              <Link href="/opportunities" className="inline-block text-xs text-blue-600 font-medium hover:underline mt-3">
                Browse all listings
              </Link>
            </Card>
          </aside>

        </div>
      </div>
    </div>
  );
}
