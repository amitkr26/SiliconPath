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
import { useNotifications, useMarkNotificationsRead, useMarkSingleNotificationRead } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

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

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "career", label: "Career" },
  { key: "network", label: "Network" },
  { key: "messages", label: "Messages" },
  { key: "feed", label: "Feed" },
] as const;

type FilterTab = (typeof FILTER_TABS)[number]["key"];

const TAB_FILTERS: Record<string, string[]> = {
  career: ["opportunity_match"],
  network: ["connection_request", "connection_accepted", "follow", "profile_view", "skill_endorsement", "recommendation"],
  messages: ["message"],
  feed: ["post_like", "post_comment", "post_repost", "company_post"],
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { data, isLoading: notificationsLoading } = useNotifications();
  const markAllRead = useMarkNotificationsRead();
  const markOneRead = useMarkSingleNotificationRead();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login?redirect=/notifications");
    }
  }, [user, userLoading, router]);

  if (userLoading || notificationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-gray-50">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-gray-50">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  const notifications = data?.notifications || [];

  const filteredNotifications = activeTab === "all"
    ? notifications
    : notifications.filter((n: any) => TAB_FILTERS[activeTab]?.includes(n.type));

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.key
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="space-y-0.5">
          {filteredNotifications.map((n: any, idx: number) => {
            const Icon = TYPE_ICONS[n.type] || Bell;
            return (
              <Link
                key={n.id}
                href={getEntityLink(n)}
                onClick={() => !n.is_read && markOneRead.mutate(n.id)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg transition-colors",
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50/50",
                  "hover:bg-gray-100",
                  !n.is_read && "bg-blue-50/40 hover:bg-blue-50"
                )}
              >
                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-600">
                      {n.actor ? getInitials(n.actor.display_name || "") : "?"}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                    <Icon className="w-3 h-3 text-gray-600" />
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{n.actor?.display_name || "Someone"}</span>{" "}
                    <span className="text-gray-600">{n.message || TYPE_LABELS[n.type] || "interacted with you"}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Unread Indicator */}
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                )}
              </Link>
            );
          })}

          {filteredNotifications.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-900 font-medium">No notifications</p>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === "all"
                  ? "When someone interacts with you, it will show up here"
                  : `No ${FILTER_TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} notifications yet`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
