"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Conversation, Message } from "@/types";

interface ConversationsResponse {
  conversations: Conversation[];
}

interface MessagesResponse {
  messages: Message[];
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get<ConversationsResponse>("/api/messages"),
    staleTime: 10_000,
  });
}

export function useConversationMessages(conversationId: string) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () =>
      api.get<MessagesResponse>(`/api/messages/${conversationId}`),
    enabled: !!conversationId,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
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
