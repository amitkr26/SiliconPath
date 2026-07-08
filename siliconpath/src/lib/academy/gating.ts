import { getDB } from "../db/index.js";
import { createSupabaseServer } from "../auth/server.js";
import { listTracks, getCheckpoint } from "./data.js";

/**
 * Track gating: a track unlocks only after the PRECEDING track's checkpoint is
 * passed (>= pass_pct, default 70%). The first track (ordinal 1) is always open.
 *
 * Anonymous users: this server-side check returns "first track only"; client-side
 * localStorage progress is layered on top by the page (per spec) so anonymous
 * learners can still proceed locally without an account.
 */
export async function getUnlockedTrackIds(): Promise<Set<string>> {
  const tracks = (await listTracks()).sort((a, b) => a.ordinal - b.ordinal);
  const unlocked = new Set<string>();
  if (tracks.length === 0) return unlocked;

  // First track always unlocked.
  unlocked.add(tracks[0].id);

  const supabase = createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return unlocked; // anonymous → only first track server-side

  const { client } = getDB("core");
  for (let i = 1; i < tracks.length; i++) {
    const prev = tracks[i - 1];
    const checkpoint = await getCheckpoint(prev.id);
    if (!checkpoint) break; // no checkpoint defined yet → don't unlock further
    const { data } = await client
      .from("academy_checkpoint_results")
      .select("passed")
      .eq("user_id", userData.user.id)
      .eq("checkpoint_id", checkpoint.id)
      .eq("passed", true)
      .maybeSingle();
    if (!data) break; // previous not passed → stop unlocking
    unlocked.add(tracks[i].id);
  }
  return unlocked;
}
