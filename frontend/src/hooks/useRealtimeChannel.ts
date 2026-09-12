"use client";

import { useEffect, useRef } from "react";
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
  // Stable ref for queryKeys to avoid unnecessary channel recreation.
  const queryKeysRef = useRef(config.queryKeys);
  queryKeysRef.current = config.queryKeys;

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
            for (const key of queryKeysRef.current) {
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
  // ponytail: Only re-subscribe when table/filter/event changes, not queryKeys.
  // queryKeys are read from a stable ref that always points to latest values.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, config.event, config.schema, config.table, config.filter, queryClient]);
}
