"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, Bell, UserPlus, UserCheck, Heart, MessageCircle,
  Repeat2, Award, Star, MessageSquare, CheckCheck,
  Briefcase, Eye, Building2
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { FEATURES } from "@/lib/feature-flags";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { api } from "@/lib/api-client";
import { useUser } from "@/hooks/useUser";
import { useNotifications, useMarkNotificationsRead } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

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
  const { user, loading: userLoading } = useUser();
  const { data, isLoading: notificationsLoading } = useNotifications();
  const markAllRead = useMarkNotificationsRead();
  const markOneRead = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}`),
  });

  if (userLoading || notificationsLoading) {
    return <div className="flex items-center justify-center min-h-[80vh] bg-bg-primary"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const notifications = data?.notifications || [];

  const getEntityLink = (notif: any): string => {
    if (TYPE_LINKS[notif.type]) return TYPE_LINKS[notif.type];
    if (["post_like", "post_comment", "post_repost"].includes(notif.type) && notif.entity_id)
      return `/feed?post=${notif.entity_id}`;
    if (notif.actor?.username) return `/people/${notif.actor.username}`;
    if (notif.actor_id) return `/people/${notif.actor_id}`;
    return "#";
  };

  if (!FEATURES.LINKEDIN_ENABLED) {
    return (
      <ComingSoon
        feature="Notification Center"
        description="Stay updated when someone endorsements your skills, accepts your connection requests, or posts new comments."
      />
    );
  }

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-white shadow-brutal-sm">
            <Bell className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <Badge tone="accent">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n: any) => {
          const Icon = TYPE_ICONS[n.type] || Bell;
          return (
            <Link
              key={n.id}
              href={getEntityLink(n)}
              onClick={() => !n.is_read && markOneRead.mutate(n.id)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-2xl border-2 transition-all",
                n.is_read
                  ? "bg-white border-slate-200"
                  : "bg-white border-slate-900 shadow-brutal-sm hover:shadow-brutal",
                "hover:bg-slate-50",
              )}
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-slate-900 flex items-center justify-center">
                  <span className="text-xs font-black text-blue-600">
                    {n.actor ? getInitials(n.actor.display_name || "") : "?"}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center">
                  <Icon className="w-3 h-3 text-blue-600" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-slate-900 text-sm font-medium">
                  <span className="font-bold">{n.actor?.display_name || "Someone"}</span>{" "}
                  {n.message || TYPE_LABELS[n.type] || "interacted with you"}
                </p>
                <p className="text-slate-500 text-xs mt-0.5 font-medium">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />}
            </Link>
          );
        })}
        {notifications.length === 0 && (
          <Card className="text-center py-16">
            <Bell className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
            <p className="text-slate-900 font-bold">No notifications yet</p>
            <p className="text-slate-600 text-sm mt-1 font-medium">When someone interacts with you, it will show up here</p>
          </Card>
        )}
      </div>
    </div>
  );
}