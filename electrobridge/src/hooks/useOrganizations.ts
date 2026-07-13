"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  opportunity_count?: number;
  [key: string]: unknown;
}

interface OrganizationsResponse {
  organizations: Organization[];
  count: number;
}

interface OrganizationDetailResponse {
  organization: Organization;
}

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.get<OrganizationsResponse>("/api/organizations"),
    staleTime: 60_000,
  });
}

export function useOrganization(slug: string) {
  return useQuery({
    queryKey: ["organization", slug],
    queryFn: () =>
      api.get<OrganizationDetailResponse>(`/api/organizations/${slug}`),
    enabled: !!slug,
    staleTime: 60_000,
  });
}
