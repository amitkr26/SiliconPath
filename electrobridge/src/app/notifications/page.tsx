"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, Bell, UserPlus, UserCheck, Heart, MessageCircle,
  Repeat2, Award, Star, MessageSquare, CheckCheck,
  Briefcase, Eye, Building2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

const TYPE_ICONS: Record<string, any> = {
  connection_request: UserPlus,
  connection_accepted: UserCheck,
  follow: UserPlus,
  post_like: Heart,
  post_comment: MessageCircle,
  post_repost: Repeat2,
  skill_endorsement: Award,
  recommendation: Star,
  message: MessageSquare,
  opportunity_match: Briefcase,
  profile_view: Eye,
  company_post: Building2,
};

const TYPE_LABELS: Record<string, string> = {
  connection_request: "Connection Request",
  connection_accepted: "Connection Accepted",
  follow: "New Follower",
  post_like: "Post Liked",
  post_comment: "New Comment",
  post_repost: "Post Reposted",
  skill_endorsement: "Skill Endorsed",
  recommendation: "Recommendation",
  message: "New Message",
  opportunity_match: "Opportunity Match",
  profile_view: "Profile View",
  company_post: "Company Post",
};

const TYPE_LINKS: Record<string, string> = {
  connection_request: "/network?tab=received",
  connection_accepted: "/network?tab=connections",
  message: "/messages",
  opportunity_match: "/opportunities",
};

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login");
      else setCurrentUserId(data.user.id);
    });
  }, [router, supabase]);

  const loadNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications?limit=50");
    const data = await res.json();
    setNotifications(data.notifications || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (currentUserId) loadNotifications(); }, [currentUserId, loadNotifications]);

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const getEntityLink = (notif: any): string => {
    if (TYPE_LINKS[notif.type]) return TYPE_LINKS[notif.type];
    if (["post_like", "post_comment", "post_repost"].includes(notif.type) && notif.entity_id)
      return `/feed?post=${notif.entity_id}`;
    if (notif.actor?.username) return `/people/${notif.actor.username}`;
    if (notif.actor_id) return `/people/${notif.actor_id}`;
    return "#";
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[80vh]"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-text-primary" />
          <h1 className="font-display text-2xl font-bold text-text-primary">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-accent text-text-inverted text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-accent text-sm font-medium hover:underline"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-1">
        {notifications.map((n) => {
          const Icon = TYPE_ICONS[n.type] || Bell;
          return (
            <Link
              key={n.id}
              href={getEntityLink(n)}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`flex items-start gap-3 p-4 rounded-xl transition-colors ${
                n.is_read ? "opacity-60" : "bg-accent/5 border border-accent/10"
              } hover:bg-surface`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-accent">
                    {n.actor ? getInitials(n.actor.full_name || "") : "?"}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center">
                  <Icon className="w-3 h-3 text-accent" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-text-primary text-sm">
                  <span className="font-semibold">{n.actor?.full_name || "Someone"}</span>{" "}
                  {n.message || TYPE_LABELS[n.type] || "interacted with you"}
                </p>
                <p className="text-text-muted text-xs mt-0.5">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2" />}
            </Link>
          );
        })}
        {notifications.length === 0 && (
          <div className="text-center py-16 text-text-secondary">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm mt-1">When someone interacts with you, it will show up here</p>
          </div>
        )}
      </div>
    </div>
  );
}
