"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface Application {
  id: string;
  user_id: string;
  opportunity_id: string;
  status: string;
  applied_at: string;
  opportunity?: {
    title: string;
    organization: string;
    slug: string;
    deadline: string | null;
    location: string | null;
  };
}

interface ApplicationsResponse {
  applications: Application[];
  count: number;
}

export function useApplications() {
  return useQuery({
    queryKey: ["applications"],
    queryFn: () => api.get<ApplicationsResponse>("/api/applications"),
    staleTime: 10_000,
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch("/api/applications", { id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
