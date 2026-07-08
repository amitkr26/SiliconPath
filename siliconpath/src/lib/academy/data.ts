import { getDB } from "../db/index.js";
import type { AcademyTrack, AcademyUnit, AcademyVideo, AcademyCheckpoint } from "./types.js";

export async function listTracks(): Promise<AcademyTrack[]> {
  const { client } = getDB("core");
  const { data, error } = await client.from("academy_tracks").select("*").order("ordinal");
  if (error) throw new Error(`[academy] listTracks failed: ${error.message}`);
  return (data ?? []) as AcademyTrack[];
}

export async function getTrack(id: string): Promise<AcademyTrack | null> {
  const { client } = getDB("core");
  const { data, error } = await client.from("academy_tracks").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`[academy] getTrack failed: ${error.message}`);
  return (data as AcademyTrack) ?? null;
}

export async function listUnits(trackId: string): Promise<AcademyUnit[]> {
  const { client } = getDB("core");
  const { data, error } = await client
    .from("academy_units")
    .select("*")
    .eq("track_id", trackId)
    .order("ordinal");
  if (error) throw new Error(`[academy] listUnits failed: ${error.message}`);
  return (data ?? []) as AcademyUnit[];
}

export async function listVideosForUnits(unitIds: string[]): Promise<Record<string, AcademyVideo[]>> {
  if (unitIds.length === 0) return {};
  const { client } = getDB("core");
  const { data, error } = await client.from("academy_videos").select("*").in("unit_id", unitIds).order("ordinal");
  if (error) throw new Error(`[academy] listVideosForUnits failed: ${error.message}`);
  const byUnit: Record<string, AcademyVideo[]> = {};
  for (const v of (data ?? []) as AcademyVideo[]) {
    (byUnit[v.unit_id] ??= []).push(v);
  }
  return byUnit;
}

export async function getCheckpoint(trackId: string): Promise<AcademyCheckpoint | null> {
  const { client } = getDB("core");
  const { data, error } = await client.from("academy_checkpoints").select("*").eq("track_id", trackId).maybeSingle();
  if (error) throw new Error(`[academy] getCheckpoint failed: ${error.message}`);
  return (data as AcademyCheckpoint) ?? null;
}
