"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface ConnectionsResponse {
  connections: {
    id: string;
    display_name: string | null;
    headline: string | null;
    current_company: string | null;
    avatar_url: string | null;
  }[];
}

interface SuggestionsResponse {
  suggestions: {
    id: string;
    display_name: string | null;
    headline: string | null;
    avatar_url: string | null;
    mutual_connections?: number;
  }[];
}

export function useConnections(q?: string) {
  return useQuery({
    queryKey: ["connections", q],
    queryFn: () =>
      api.get<ConnectionsResponse>("/api/network/connections", {
        params: q ? { q } : undefined,
      }),
    staleTime: 10_000,
  });
}

export function useConnectionSuggestions() {
  return useQuery({
    queryKey: ["network", "suggestions"],
    queryFn: () =>
      api.get<SuggestionsResponse>("/api/network/suggestions"),
    staleTime: 30_000,
  });
}


