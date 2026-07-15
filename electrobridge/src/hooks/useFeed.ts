"use client";

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { FeedPost } from "@/types";

interface FeedResponse {
  posts: FeedPost[];
}

export function useFeed(limit = 20) {
  return useInfiniteQuery({
    queryKey: ["feed", limit],
    queryFn: ({ pageParam = 0 }) =>
      api.get<FeedResponse>("/api/feed", {
        params: { limit, offset: pageParam },
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.posts.length < limit) return undefined;
      return allPages.length * limit;
    },
    initialPageParam: 0,
    staleTime: 15_000,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api.post<FeedPost>("/api/feed", { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) =>
      api.post(`/api/feed/posts/${postId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
