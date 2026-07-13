"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Opportunity, UserProfile } from "@/types";

interface SearchResponse {
  opportunities: Opportunity[];
  people: Partial<UserProfile>[];
  total_count: number;
  page: number;
}

export function useSearch(query: string, page = 1) {
  return useQuery({
    queryKey: ["search", query, page],
    queryFn: () =>
      api.get<SearchResponse>("/api/search", {
        params: { q: query, page },
      }),
    enabled: !!query && query.length >= 2,
    staleTime: 30_000,
  });
}
