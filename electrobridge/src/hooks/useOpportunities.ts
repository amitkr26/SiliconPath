"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Opportunity } from "@/types";

interface OpportunitiesResponse {
  opportunities: Opportunity[];
  count: number;
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface OpportunityDetailResponse {
  opportunity: Opportunity;
}

interface OpportunitiesFilters {
  page?: number;
  limit?: number;
  category?: string;
  eligibility?: string;
  location?: string;
  deadline?: string;
  verified?: string;
  search?: string;
}

export function useOpportunities(filters: OpportunitiesFilters = {}) {
  return useQuery({
    queryKey: ["opportunities", filters],
    queryFn: () =>
      api.get<OpportunitiesResponse>("/api/opportunities", {
        params: { page: 1, limit: 30, ...filters },
      }),
    staleTime: 30_000,
  });
}

export function useOpportunitiesInfinite(filters: OpportunitiesFilters = {}) {
  return useInfiniteQuery({
    queryKey: ["opportunities", "infinite", filters],
    queryFn: ({ pageParam = 1 }) =>
      api.get<OpportunitiesResponse>("/api/opportunities", {
        params: { ...filters, page: pageParam, limit: filters.limit || 30 },
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) return lastPage.page + 1;
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30_000,
  });
}

export function useOpportunity(slug: string) {
  return useQuery({
    queryKey: ["opportunity", slug],
    queryFn: () =>
      api.get<OpportunityDetailResponse>(`/api/opportunities/by-slug/${slug}`),
    enabled: !!slug,
    staleTime: 60_000,
  });
}
