"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import type { Notification } from "@/types";

interface NotificationsResponse {
  notifications: Notification[];
}

interface NotificationCountResponse {
  count: number;
}

export function useNotifications(unreadOnly = false, limit = 50) {
  const result = useQuery({
    queryKey: ["notifications", unreadOnly, limit],
    queryFn: () =>
      api.get<NotificationsResponse>("/api/notifications", {
        params: { limit, unread: unreadOnly ? "true" : undefined },
      }),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  useRealtimeChannel("notifications-list", {
    event: "*",
    table: "notifications",
    queryKeys: [["notifications"], ["notifications", "count"]],
  });

  return result;
}

export function useNotificationCount(enabled = true) {
  const result = useQuery({
    queryKey: ["notifications", "count"],
    queryFn: () => api.get<NotificationCountResponse>("/api/notifications/count"),
    enabled,
    staleTime: 30_000,
    refetchInterval: enabled ? 60_000 : undefined,
  });

  useRealtimeChannel(enabled ? "notifications-count" : "notifications-count-disabled", {
    event: "INSERT",
    table: "notifications",
    queryKeys: [["notifications", "count"], ["notifications"]],
    enabled,
  });

  return result;
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/api/notifications"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkSingleNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
