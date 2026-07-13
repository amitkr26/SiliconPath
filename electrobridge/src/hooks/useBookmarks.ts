"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Opportunity } from "@/types";

interface BookmarksResponse {
  bookmarks: { id: string; opportunity_id: string; opportunities: Opportunity }[];
  count: number;
}

export function useBookmarks(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ["bookmarks", limit, offset],
    queryFn: () =>
      api.get<BookmarksResponse>("/api/bookmarks", {
        params: { limit, offset },
      }),
    staleTime: 10_000,
  });
}

export function useAddBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (opportunityId: string) =>
      api.post<{ bookmark: { id: string } }>("/api/bookmarks", { opportunityId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useRemoveBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookmarkId: string) =>
      api.delete(`/api/bookmarks/${bookmarkId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}
