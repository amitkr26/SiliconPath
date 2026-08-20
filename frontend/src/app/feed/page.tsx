"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Send, ThumbsUp, MessageCircle, Repeat2, Trash2, Users, Briefcase,
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
  const { data: feedData, isLoading: feedLoading } = useFeed(20);
  const createPost = useCreatePost();
  const likePost = useLikePost();
  const [content, setContent] = useState("");
  const [opps, setOpps] = useState<Opp[]>([]);

  const posts = feedData?.pages.flatMap((p) => p.posts) ?? [];

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
        toast.success("Posted!");
      },
      onError: () => {
        toast.error("Failed to post");
      },
    });
  };

  const like = (postId: string) => {
    likePost.mutate(postId);
  };

  const remove = async (postId: string) => {
    try {
      const res = await api.delete(`/api/feed/posts/${postId}`);
      toast.success("Deleted");
    } catch {
      /* ignore */
    }
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
          {/* Composer */}
          <Card className="p-4 sm:p-5">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 border-2 border-slate-900 text-white flex items-center justify-center text-sm font-black flex-shrink-0 shadow-brutal-sm">
                {initials(displayName)}
              </div>
              <div className="flex-1 min-w-0">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share something with your network..."
                  rows={2}
                  className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-medium rounded-xl px-3.5 py-2.5 placeholder:text-slate-400 shadow-brutal-sm focus:outline-none focus:border-accent focus:shadow-brutal resize-none transition-all"
                />
                <div className="flex justify-end mt-2.5">
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

          {/* Posts */}
          {posts.length === 0 ? (
            <Card className="p-10 text-center">
              <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-900 font-bold">No posts yet</p>
              <p className="text-slate-600 text-sm mt-1 font-medium">
                Connect with people to see their posts here.
              </p>
              <Link href="/network" className="inline-block mt-4 text-accent text-sm font-bold">
                Find people to follow
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post: FeedPost) => (
                <Card key={post.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 border-2 border-slate-900 text-white flex items-center justify-center text-sm font-black flex-shrink-0 shadow-brutal-sm">
                        {initials(post.author?.display_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {post.author?.display_name || "Member"}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">{timeAgo(post.created_at)}</p>
                      </div>
                    </div>
                    {post.user_id === user?.id && (
                      <button
                        onClick={() => remove(post.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        aria-label="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-slate-800 mt-3 whitespace-pre-wrap break-words font-medium">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t-2 border-slate-200">
                    <button
                      onClick={() => like(post.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 text-xs font-bold transition-all",
                        post.user_reaction
                          ? "bg-blue-600 text-white border-slate-900 shadow-brutal-sm"
                          : "bg-white text-slate-600 border-slate-900 hover:bg-slate-100 hover:text-slate-900",
                      )}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> {post.likes_count || 0}
                    </button>
                    <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-slate-900 text-xs font-semibold text-slate-600 bg-white">
                      <MessageCircle className="w-3.5 h-3.5" /> {post.comments_count || 0}
                    </span>
                    <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-slate-900 text-xs font-semibold text-slate-600 bg-white">
                      <Repeat2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-4">
          <Card className="p-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" /> Latest Opportunities
            </h3>
            <div className="space-y-3">
              {opps.length === 0 && <p className="text-xs text-slate-500 font-medium">No opportunities yet</p>}
              {opps.map((o) => (
                <Link
                  key={o.id}
                  href={o.slug ? `/opportunities/${o.slug}` : "/opportunities"}
                  className="block group"
                >
                  <p className="text-sm font-medium text-slate-900 group-hover:text-accent transition-colors line-clamp-2">
                    {o.title}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">{o.organizations?.name || ""}</p>
                </Link>
              ))}
            </div>
            <Link href="/opportunities" className="inline-block mt-3 text-xs font-bold text-accent">
              View all
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}