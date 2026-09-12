"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import type { Conversation, Message } from "@/types";

interface ConversationsResponse {
  conversations: Conversation[];
}

interface MessagesResponse {
  messages: Message[];
}

export function useConversations() {
  const result = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get<ConversationsResponse>("/api/messages"),
    staleTime: 3_000,
    refetchInterval: 10_000,
  });

  // Real-time: invalidate when any message is inserted/updated
  useRealtimeChannel("conversations-list", {
    event: "*",
    table: "messages",
    queryKeys: [["conversations"]],
  });

  return result;
}

export function useConversationMessages(conversationId: string) {
  const result = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () =>
      api.get<MessagesResponse>(`/api/messages/${conversationId}`),
    enabled: !!conversationId,
    staleTime: 2_000,
    refetchInterval: 10_000,
  });

  // Real-time: invalidate when messages change in this conversation
  useRealtimeChannel(`messages:${conversationId}`, {
    event: "*",
    table: "messages",
    filter: conversationId ? `conversation_id=eq.${conversationId}` : undefined,
    queryKeys: [["messages", conversationId], ["conversations"]],
  });

  return result;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participantId,
      content,
    }: {
      participantId: string;
      content: string;
    }) =>
      api.post<{ conversation_id: string; message: Message }>("/api/messages", {
        participantId,
        content,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["messages", data.conversation_id],
      });
    },
  });
}

/** Mark specific messages as read (per-message read receipts). */
export function useMarkMessagesRead(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageIds: string[]) =>
      api.patch(`/api/messages/${conversationId}`, { messageIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
