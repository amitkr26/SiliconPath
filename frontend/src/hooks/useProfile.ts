"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useUser } from "./useUser";

interface Profile {
  id: string;
  display_name?: string;
  headline?: string;
  bio?: string;
  job_title?: string;
  current_company?: string;
  location?: string;
  country?: string;
  website_url?: string;
  linkedin_url?: string;
  github_url?: string;
  avatar_url?: string | null;
  skills?: string[];
  is_open_to_work?: boolean;
  experience_years?: number | null;
  resume_ats_score?: number;
  [key: string]: unknown;
}

export function useProfile(userId?: string) {
  const { user } = useUser();
  const id = userId || user?.id;

  return useQuery({
    queryKey: ["profile", id],
    queryFn: () => api.get<Profile>(`/api/profile/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}
