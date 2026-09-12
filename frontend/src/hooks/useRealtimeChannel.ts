"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Subscribe to Supabase Realtime postgres_changes on a table and
 * automatically invalidate React Query caches when rows change.
 *
 * ponytail: Falls back silently if Realtime is not enabled on the table.
 * The existing refetchInterval in the parent hooks provides a polling safety net.
 */
export function useRealtimeChannel(
  channelName: string,
  config: {
    event?: "INSERT" | "UPDATE" | "DELETE" | "*";
    schema?: string;
    table: string;
    filter?: string;
    queryKeys: string[][];
  },
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    try {
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: config.event ?? "*",
            schema: config.schema ?? "public",
            table: config.table,
            filter: config.filter,
          },
          () => {
            for (const key of config.queryKeys) {
              queryClient.invalidateQueries({ queryKey: key });
            }
          },
        )
        .subscribe();
    } catch {
      // Realtime not available — polling fallback handles it
      return;
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [channelName, config.event, config.schema, config.table, config.filter, queryClient, config.queryKeys]);
}
