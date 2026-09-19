"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import type { Conversation, Message } from "@/types";

interface ConversationsResponse {
  conversations: Conversation[];
}

export interface MessagesResponse {
  messages: Message[];
  next_cursor?: string | null;
  has_more?: boolean;
}

interface UnreadCountResponse {
  unread_count: number;
}

/**
 * Lightweight scalar unread message count hook.
 * Replaces the heavy useConversations() call previously mounted in Navbar.
 */
export function useUnreadMessageCount(enabled = true) {
  const result = useQuery({
    queryKey: ["messages-unread-count"],
    queryFn: () => api.get<UnreadCountResponse>("/api/messages/unread-count"),
    enabled,
    staleTime: 15_000,
    refetchInterval: false, // Pure Realtime push; no timer polling
    refetchOnWindowFocus: true,
  });

  // Targeted Realtime invalidation on message events
  useRealtimeChannel(enabled ? "messages-unread-count" : "messages-unread-count-disabled", {
    event: "*",
    table: "messages",
    queryKeys: [["messages-unread-count"]],
    enabled,
  });

  return result;
}

/**
 * Conversations list hook for messaging dashboards.
 */
export function useConversations(enabled = true) {
  const result = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get<ConversationsResponse>("/api/messages"),
    enabled,
    staleTime: 10_000,
    refetchInterval: false, // Pure Realtime push; no timer polling
    refetchOnWindowFocus: true,
  });

  // Real-time: invalidate conversations list when messages change
  useRealtimeChannel(enabled ? "conversations-list" : "conversations-list-disabled", {
    event: "*",
    table: "messages",
    queryKeys: [["conversations"], ["messages-unread-count"]],
    enabled,
  });

  return result;
}

/**
 * Conversation messages hook with cursor pagination support.
 */
export function useConversationMessages(
  conversationId: string,
  options?: { limit?: number; before?: string | null }
) {
  const limit = options?.limit ?? 30;
  const before = options?.before ?? null;

  const queryParams = new URLSearchParams();
  if (limit) queryParams.set("limit", String(limit));
  if (before) queryParams.set("before", before);
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const result = useQuery({
    queryKey: ["messages", conversationId, before],
    queryFn: () =>
      api.get<MessagesResponse>(`/api/messages/${conversationId}${queryString}`),
    enabled: !!conversationId,
    staleTime: 10_000,
    refetchInterval: false, // Relies on Realtime with event push
  });

  // Targeted Realtime: Listen only to messages within this active conversation
  useRealtimeChannel(`messages:${conversationId}`, {
    event: "*",
    table: "messages",
    filter: conversationId ? `conversation_id=eq.${conversationId}` : undefined,
    queryKeys: [
      ["messages", conversationId],
      ["conversations"],
      ["messages-unread-count"],
    ],
    enabled: !!conversationId,
  });

  return result;
}

/**
 * Send a message mutation with targeted query invalidation.
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participantId,
      conversationId,
      content,
    }: {
      participantId?: string;
      conversationId?: string;
      content: string;
    }) =>
      api.post<{ conversation_id: string; message: Message }>("/api/messages", {
        participantId,
        conversationId,
        content,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages-unread-count"] });
      if (data?.conversation_id) {
        queryClient.invalidateQueries({
          queryKey: ["messages", data.conversation_id],
        });
      }
    },
  });
}

/**
 * Mark messages in a conversation as read.
 */
export function useMarkMessagesRead(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args?: { messageIds?: string[]; markAllRead?: boolean }) =>
      api.patch(`/api/messages/${conversationId}`, {
        messageIds: args?.messageIds,
        markAllRead: args?.markAllRead ?? true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages-unread-count"] });
    },
  });
}
