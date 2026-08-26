"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Send, ThumbsUp, MessageCircle, Repeat2, Trash2, Users, Briefcase, Sparkles, Tag, Check, Edit2, X
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useFeed, useCreatePost, useLikePost } from "@/hooks/useFeed";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { FeedPost } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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

const FEED_TAGS = [
  { id: "all", label: "All Discussions" },
  { id: "#RTL_Design", label: "#RTL_Design" },
  { id: "#Verification_UVM", label: "#Verification_UVM" },
  { id: "#Physical_Design", label: "#Physical_Design" },
  { id: "#STA_Timing", label: "#STA_Timing" },
  { id: "#Embedded_Systems", label: "#Embedded_Systems" },
  { id: "#Research_JRF", label: "#Research_JRF" },
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

export default function FeedPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { data: feedData, isLoading: feedLoading } = useFeed(30);
  const createPost = useCreatePost();
  const likePost = useLikePost();
  const [content, setContent] = useState("");
  const [activeTag, setActiveTag] = useState("all");
  const [opps, setOpps] = useState<Opp[]>([]);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, CommentItem[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const allPosts = feedData?.pages.flatMap((p) => p.posts) ?? [];
  const posts = activeTag === "all"
    ? allPosts
    : allPosts.filter((p) => (p.content || "").toLowerCase().includes(activeTag.toLowerCase()));

  const displayName =
    (user as any)?.user_metadata?.display_name ||
    user?.email ||
    "You";

  const loadOpps = useCallback(async () => {
    try {
      const res = await fetch("/api/opportunities?limit=4");
      if (res.ok) {
        const data = await res.json();
        setOpps((data.opportunities || []).slice(0, 4));
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
    loadOpps();
  }, [loadOpps]);

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
      window.location.reload();
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
      window.location.reload();
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

  if (userLoading || feedLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Main column */}
        <div className="space-y-4 min-w-0">
          {/* Tag Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {FEED_TAGS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTag(t.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border-2 border-slate-900 shadow-brutal-sm transition-all",
                  activeTag === t.id
                    ? "bg-blue-600 text-white shadow-brutal"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Composer */}
          <Card className="p-4 sm:p-5 border-2 border-slate-900 shadow-brutal-sm">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 border-2 border-slate-900 text-white flex items-center justify-center text-sm font-black flex-shrink-0 shadow-brutal-sm">
                {initials(displayName)}
              </div>
              <div className="flex-1 min-w-0">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share a technical update, RTL project, research finding, or career milestone..."
                  rows={3}
                  className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-medium rounded-xl px-3.5 py-2.5 placeholder:text-slate-400 shadow-brutal-sm focus:outline-none focus:border-accent focus:shadow-brutal resize-none transition-all"
                />

                {/* Tag Shortcuts */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Quick Tags:
                  </span>
                  {FEED_TAGS.slice(1, 6).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleAddTag(t.id)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[10px] font-bold rounded border border-slate-300 transition-colors"
                    >
                      {t.id}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end mt-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={createPost.isPending || !content.trim()}
                    size="sm"
                    className="border-2 border-slate-900 shadow-brutal-sm"
                  >
                    {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Post Discussion
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Posts Feed */}
          {posts.length === 0 ? (
            <Card className="p-10 text-center border-2 border-slate-900 shadow-brutal-sm">
              <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-900 font-bold">No discussions in this channel yet</p>
              <p className="text-slate-600 text-sm mt-1 font-medium">
                Be the first semiconductor engineer to start a thread here!
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
          ) : (
            <div className="space-y-4">
              {posts.map((post: FeedPost) => {
                const isAuthor = post.user_id === user?.id || (post as any).author_id === user?.id;
                const authorUsername = (post.author as any)?.username || post.user_id;
                const isEditing = editingPostId === post.id;
                const isCommentsOpen = !!expandedComments[post.id];
                const comments = postComments[post.id] || [];

                return (
                  <Card key={post.id} className="p-4 sm:p-5 border-2 border-slate-900 shadow-brutal-sm">
                    {/* Author Header */}
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={authorUsername ? `/profile/${authorUsername}` : "#"}
                        className="flex items-center gap-3 min-w-0 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-600 border-2 border-slate-900 text-white flex items-center justify-center text-sm font-black flex-shrink-0 shadow-brutal-sm overflow-hidden">
                          {post.author?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            initials(post.author?.display_name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {post.author?.display_name || "Semiconductor Engineer"}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">
                            {post.author?.headline ? `${post.author.headline} · ` : ""}
                            {timeAgo(post.created_at)}
                          </p>
                        </div>
                      </Link>

                      {isAuthor && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(post)}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Edit post"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => remove(post.id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
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
                          className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-medium rounded-xl p-2.5 shadow-brutal-sm focus:outline-none"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setEditingPostId(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => saveEdit(post.id)}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-800 mt-3 whitespace-pre-wrap break-words font-medium leading-relaxed">
                        {post.content}
                      </p>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t-2 border-slate-200">
                      <button
                        onClick={() => like(post.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 text-xs font-bold transition-all",
                          post.user_reaction
                            ? "bg-blue-600 text-white border-slate-900 shadow-brutal-sm"
                            : "bg-white text-slate-600 border-slate-900 hover:bg-slate-100 hover:text-slate-900"
                        )}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> {post.likes_count || 0}
                      </button>

                      <button
                        onClick={() => toggleComments(post.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 border-slate-900 text-xs font-bold transition-all",
                          isCommentsOpen
                            ? "bg-slate-100 text-slate-900 shadow-brutal-sm"
                            : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                        <span>{post.comments_count || comments.length || 0} Comments</span>
                      </button>
                    </div>

                    {/* Expandable Comments Drawer */}
                    {isCommentsOpen && (
                      <div className="mt-4 pt-3 border-t border-slate-200 space-y-3 bg-slate-50/80 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-5 rounded-b-xl">
                        {/* Add Comment Input */}
                        <div className="flex gap-2">
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
                            className="flex-1 bg-white border-2 border-slate-900 text-xs font-medium rounded-xl px-3 py-2 placeholder:text-slate-400 focus:outline-none shadow-brutal-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(post.id)}
                            disabled={submittingComment[post.id] || !commentInputs[post.id]?.trim()}
                            className="border-2 border-slate-900 shadow-brutal-sm text-xs px-3"
                          >
                            {submittingComment[post.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reply"}
                          </Button>
                        </div>

                        {/* Comments List */}
                        {comments.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-1">No comments yet. Start the conversation!</p>
                        ) : (
                          <div className="space-y-2 pt-1">
                            {comments.map((c) => (
                              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <Link
                                    href={c.user_profile?.username ? `/profile/${c.user_profile.username}` : "#"}
                                    className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1.5"
                                  >
                                    <div className="w-5 h-5 rounded bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                                      {initials(c.user_profile?.display_name)}
                                    </div>
                                    {c.user_profile?.display_name || "Engineer"}
                                  </Link>
                                  <span className="text-[10px] text-slate-400 font-semibold">{timeAgo(c.created_at)}</span>
                                </div>
                                <p className="text-xs text-slate-700 font-medium pl-6 leading-relaxed">{c.content}</p>
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
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-4">
          <Card className="p-5 border-2 border-slate-900 shadow-brutal-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" /> Verified Opportunities
            </h3>
            <div className="space-y-3">
              {opps.length === 0 && <p className="text-xs text-slate-500 font-medium">No opportunities yet</p>}
              {opps.map((o) => (
                <Link
                  key={o.id}
                  href={o.slug ? `/opportunities/${o.slug}` : "/opportunities"}
                  className="block group"
                >
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {o.title}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{o.organizations?.name || "Semiconductor Org"}</p>
                </Link>
              ))}
            </div>
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-1 mt-4 text-xs font-black text-blue-600 hover:underline"
            >
              Browse All Listings →
            </Link>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-slate-900 shadow-brutal-sm space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Community Standard</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              SiliconPath is a dedicated platform for hardware, VLSI, microelectronics, and scientific fellows. Keep discussions rigorous and technical.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}