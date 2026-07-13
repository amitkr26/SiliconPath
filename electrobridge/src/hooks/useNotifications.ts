"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Notification } from "@/types";

interface NotificationsResponse {
  notifications: Notification[];
}

interface NotificationCountResponse {
  count: number;
}

export function useNotifications(unreadOnly = false, limit = 50) {
  return useQuery({
    queryKey: ["notifications", unreadOnly, limit],
    queryFn: () =>
      api.get<NotificationsResponse>("/api/notifications", {
        params: { limit, unread: unreadOnly ? "true" : undefined },
      }),
    staleTime: 10_000,
  });
}

export function useNotificationCount() {
  return useQuery({
    queryKey: ["notifications", "count"],
    queryFn: () => api.get<NotificationCountResponse>("/api/notifications/count"),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
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
