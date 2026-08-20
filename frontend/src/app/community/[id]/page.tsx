"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import {
  Loader2, ArrowLeft, ArrowUp, MessageCircle, Send, ArrowUp as ArrowUpIcon
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_profiles?: { display_name: string } | null;
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
  user_profiles?: { display_name: string } | null;
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
  const { user } = useUser();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [userVoted, setUserVoted] = useState(false);

  useEffect(() => {
    api.get<PostDetail>(`/api/community/posts/${params.id}`)
      .then(data => { setPost(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleVote = async () => {
    if (!user) { toast.error("Login to vote"); return; }
    try {
      await api.post("/api/community/vote", { post_id: params.id });
      setPost(prev => prev ? { ...prev, upvotes: userVoted ? prev.upvotes - 1 : prev.upvotes + 1 } : prev);
      setUserVoted(!userVoted);
    } catch {}
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    if (!user) { toast.error("Login to comment"); return; }
    setCommenting(true);
    try {
      const newComment = await api.post<Comment>("/api/community/comments", {
        post_id: params.id,
        content: commentText,
      });
      setPost(prev => prev ? {
        ...prev,
        comments: [...prev.comments, { ...newComment, user_profiles: user?.user_metadata?.full_name ? { display_name: user.user_metadata.full_name } : null }],
        comment_count: prev.comment_count + 1,
      } : prev);
      setCommentText("");
      toast.success("Comment added!");
    } catch (err: any) {
      const message = err?.body?.error || "Something went wrong";
      toast.error(message);
    }
    setCommenting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-bg-primary">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-black text-slate-900 mb-4">Post not found</h1>
        <Link href="/community" className="text-accent font-bold hover:underline">Back to Community</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/community" className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 text-sm font-medium mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Community
      </Link>

      <Card className="p-6 mb-6">
        <div className="flex items-start gap-4">
          <button
            onClick={handleVote}
            className={cn(
              "flex flex-col items-center gap-0.5 min-w-[48px] py-2 border-2 rounded-xl transition-all",
              userVoted
                ? "bg-blue-600 text-white border-slate-900 shadow-brutal-sm"
                : "bg-white text-slate-500 border-slate-900 hover:text-blue-600 hover:shadow-brutal-sm",
            )}
          >
            <ArrowUpIcon className={`w-6 h-6 ${userVoted ? "fill-current" : ""}`} />
            <span className="text-sm font-black">{post.upvotes}</span>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="w-7 h-7 rounded-full bg-blue-50 border-2 border-slate-900 flex items-center justify-center">
                <span className="text-blue-600 text-xs font-black">{getInitials(post.user_profiles?.display_name)}</span>
              </div>
              <span className="text-slate-600 text-sm font-semibold">{post.user_profiles?.display_name || "Anonymous"}</span>
              <span className="text-slate-400 text-xs font-medium">·</span>
              <span className="text-slate-400 text-xs font-medium">{formatTimeAgo(post.created_at)}</span>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border-2 border-slate-900 text-xs font-bold">
                {post.category}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-3">{post.title}</h1>
            <p className="text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-wrap">{post.content}</p>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-0.5 bg-white text-slate-700 rounded-full border-2 border-slate-300 text-xs font-semibold">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Comments */}
      <Card className="p-6">
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          Comments ({post.comment_count})
        </h2>

        {/* Comment input */}
        {user ? (
          <div className="flex gap-2 mb-6">
            <Input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleComment(); }}
              placeholder="Write a comment..."
              className="flex-1"
            />
            <Button
              onClick={handleComment}
              disabled={commenting || !commentText.trim()}
              className="shrink-0"
              ariaLabel="Post comment"
            >
              {commenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        ) : (
          <div className="mb-6 p-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-center">
            <Link href="/login" className="text-accent text-sm font-bold hover:underline">Login to comment</Link>
          </div>
        )}

        {/* Comment list */}
        {post.comments.length === 0 ? (
          <p className="text-slate-500 text-sm font-medium text-center py-6">No comments yet. Be the first to respond!</p>
        ) : (
          <div className="space-y-4">
            {post.comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-3 pb-4 border-b-2 border-slate-100 last:border-0">
                <div className="w-6 h-6 rounded-full bg-blue-50 border-2 border-slate-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-[10px] font-black">{getInitials(comment.user_profiles?.display_name)}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-slate-900 text-xs font-bold">{comment.user_profiles?.display_name || "Anonymous"}</span>
                    <span className="text-slate-400 text-xs font-medium">{formatTimeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-slate-700 text-sm font-medium">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}