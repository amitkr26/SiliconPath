"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Check, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Track {
  slug: string;
  title: string;
  description: string;
  order_index: number;
  estimated_days: number;
  estimated_hours: number;
  prerequisites: string[];
}

export default function AcademyTracks({ tracks }: { tracks: Track[] }) {
  const [passed, setPassed] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return; // anonymous: no synced progress, tracks still render
        const { data } = await supabase
          .from("academy_assessment_results")
          .select("track_slug")
          .eq("user_id", user.id)
          .eq("passed", true);
        if (!cancelled && data) setPassed(data.map((r: any) => r.track_slug));
      } catch {
        /* progress is optional; never block track rendering */
      } finally {
        if (!cancelled) setLoadingProgress(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {tracks.map((track) => {
        const unlocked =
          track.prerequisites.length === 0 ||
          track.prerequisites.every((p) => passed.includes(p));
        const isPassed = passed.includes(track.slug);

        return (
          <div
            key={track.slug}
            className={`rounded-2xl border bg-surface p-5 transition-all sm:p-6 ${
              unlocked ? "border-border-subtle hover:border-border hover:shadow-sm" : "border-border-subtle opacity-60"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-sm font-extrabold text-primary">
                  {String(track.order_index).padStart(2, "0")}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{track.title}</h3>
                    {isPassed && (
                      <span className="inline-flex items-center gap-1 rounded bg-[oklch(95%_0.025_155)] px-2 py-0.5 text-xs font-semibold text-[oklch(45%_0.14_155)]">
                        <Check className="h-3 w-3" /> Passed
                      </span>
                    )}
                    {!unlocked && (
                      <span className="inline-flex items-center gap-1 rounded bg-surface-raised px-2 py-0.5 text-xs font-medium text-text-tertiary">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </div>
                  <p className="mt-1 max-w-prose text-sm text-text-secondary">{track.description}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-text-tertiary">
                    <span>{track.estimated_days} days</span>
                    <span>{track.estimated_hours} hours</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                {unlocked ? (
                  <Link
                    href={`/academy/${track.slug}`}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover sm:w-auto"
                  >
                    Start Track <Play className="h-3.5 w-3.5 fill-current" />
                  </Link>
                ) : (
                  <span className="text-xs text-text-tertiary">
                    Unlocks after: {track.prerequisites.join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {loadingProgress && (
        <p className="text-center text-xs text-text-tertiary">Syncing your progress…</p>
      )}
    </div>
  );
}
