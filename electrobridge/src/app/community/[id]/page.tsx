"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, ArrowLeft, ArrowUp, MessageCircle, Send, ArrowUp as ArrowUpIcon
} from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_profiles?: { full_name: string } | null;
}

interface PostDetail {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  upvotes: number;
  comment_count: number;
  created_at: string;
  user_id: string;
  user_profiles?: { full_name: string } | null;
  comments: Comment[];
}

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
};

const formatTimeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [userVoted, setUserVoted] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  useEffect(() => {
    fetch(`/api/community/posts/${params.id}`)
      .then(r => r.json())
      .then(data => { setPost(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleVote = async () => {
    if (!user) { toast.error("Login to vote"); return; }
    try {
      await fetch("/api/community/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: params.id }),
      });
      setPost(prev => prev ? { ...prev, upvotes: userVoted ? prev.upvotes - 1 : prev.upvotes + 1 } : prev);
      setUserVoted(!userVoted);
    } catch {}
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    if (!user) { toast.error("Login to comment"); return; }
    setCommenting(true);
    try {
      const res = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: params.id, content: commentText }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setPost(prev => prev ? {
          ...prev,
          comments: [...prev.comments, { ...newComment, user_profiles: user?.user_metadata?.full_name ? { full_name: user.user_metadata.full_name } : null }],
          comment_count: prev.comment_count + 1,
        } : prev);
        setCommentText("");
        toast.success("Comment added!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to comment");
      }
    } catch { toast.error("Something went wrong"); }
    setCommenting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-text-primary mb-4">Post not found</h1>
        <Link href="/community" className="text-accent hover:underline">Back to Community</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/community" className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm font-medium mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Community
      </Link>

      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <button
            onClick={handleVote}
            className={`flex flex-col items-center gap-0.5 min-w-[40px] pt-1 ${userVoted ? "text-accent" : "text-text-muted hover:text-accent"}`}
          >
            <ArrowUpIcon className={`w-6 h-6 ${userVoted ? "fill-accent" : ""}`} />
            <span className="text-sm font-bold">{post.upvotes}</span>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-accent text-xs font-bold">{getInitials(post.user_profiles?.full_name)}</span>
              </div>
              <span className="text-text-secondary text-sm">{post.user_profiles?.full_name || "Anonymous"}</span>
              <span className="text-text-muted text-xs">·</span>
              <span className="text-text-muted text-xs">{formatTimeAgo(post.created_at)}</span>
              <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs border border-accent/30">{post.category}</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary mb-3">{post.title}</h1>
            <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-accent/5 text-accent rounded text-xs border border-accent/20">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-display text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-accent" />
          Comments ({post.comment_count})
        </h2>

        {/* Comment input */}
        {user ? (
          <div className="flex gap-2 mb-6">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleComment(); }}
              placeholder="Write a comment..."
              className="flex-1 bg-surface-elevated border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-accent focus:border-accent outline-none"
            />
            <button
              onClick={handleComment}
              disabled={commenting || !commentText.trim()}
              className="flex items-center gap-1 bg-accent text-bg-primary rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {commenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <div className="mb-6 p-3 bg-surface-elevated border border-border rounded-lg text-center">
            <Link href="/login" className="text-accent text-sm hover:underline">Login to comment</Link>
          </div>
        )}

        {/* Comment list */}
        {post.comments.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-6">No comments yet. Be the first to respond!</p>
        ) : (
          <div className="space-y-4">
            {post.comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-accent text-[10px] font-bold">{getInitials(comment.user_profiles?.full_name)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-text-primary text-xs font-medium">{comment.user_profiles?.full_name || "Anonymous"}</span>
                    <span className="text-text-muted text-xs">{formatTimeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-text-secondary text-sm">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
