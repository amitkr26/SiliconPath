// src/lib/academy/queries.ts
import { supabase, isConfigured } from "../supabase";
import { LearningTrack, LearningDay, TrackCheckpoint, UserProgressItem, TrackSlug } from "./types";

const TRACK_METADATA: Record<string, { slug: TrackSlug; color: string; icon: string; estimated_days: number; estimated_hours: number; prerequisites: TrackSlug[] }> = {
  'Digital Logic Fundamentals': { slug: 'digital-logic', color: '#00E5FF', icon: 'Cpu', estimated_days: 30, estimated_hours: 45, prerequisites: [] },
  'Verilog HDL': { slug: 'verilog', color: '#10B981', icon: 'Code2', estimated_days: 30, estimated_hours: 45, prerequisites: ['digital-logic'] },
  'SystemVerilog for Verification': { slug: 'systemverilog', color: '#A855F7', icon: 'Shield', estimated_days: 30, estimated_hours: 45, prerequisites: ['verilog'] },
  'Universal Verification Methodology (UVM)': { slug: 'uvm', color: '#F59E0B', icon: 'TestTube', estimated_days: 30, estimated_hours: 45, prerequisites: ['systemverilog'] },
  'RTL Design & Synthesis': { slug: 'rtl-design', color: '#EC4899', icon: 'Layers', estimated_days: 25, estimated_hours: 40, prerequisites: ['verilog'] },
  'Physical Design & Backend': { slug: 'physical-design', color: '#8B5CF6', icon: 'Layers3', estimated_days: 35, estimated_hours: 55, prerequisites: ['rtl-design'] },
  'VLSI Interview Preparation': { slug: 'interview-prep', color: '#EF4444', icon: 'Trophy', estimated_days: 20, estimated_hours: 30, prerequisites: ['physical-design'] }
};

export const FALLBACK_TRACKS: LearningTrack[] = [
  { id: "digital-logic-fallback", name: "Digital Logic Fundamentals", title: "Digital Logic Fundamentals", slug: "digital-logic", order_index: 1, unlock_condition: null, description: "Master number systems, Boolean algebra, K-maps, combinational and sequential circuit design, finite state machines, and timing analysis.", estimated_days: 30, estimated_hours: 45, color: "#00E5FF", icon: "Cpu", prerequisites: [] },
  { id: "verilog-fallback", name: "Verilog HDL", title: "Verilog HDL", slug: "verilog", order_index: 2, unlock_condition: "Pass Track 1 assessment >= 70%", description: "Learn hardware description and RTL design using Verilog. Covers module structure, dataflow/behavioral modeling, FSM design, testbenches.", estimated_days: 30, estimated_hours: 45, color: "#10B981", icon: "Code2", prerequisites: ["digital-logic"] },
  { id: "sv-fallback", name: "SystemVerilog for Verification", title: "SystemVerilog for Verification", slug: "systemverilog", order_index: 3, unlock_condition: "Pass Track 2 assessment >= 70%", description: "Deep dive into SystemVerilog: OOP, constrained-random verification, functional coverage, assertions (SVA), and interface-based testbench architecture.", estimated_days: 30, estimated_hours: 45, color: "#A855F7", icon: "Shield", prerequisites: ["verilog"] },
  { id: "uvm-fallback", name: "Universal Verification Methodology (UVM)", title: "Universal Verification Methodology (UVM)", slug: "uvm", order_index: 4, unlock_condition: "Pass Track 3 assessment >= 70%", description: "Master the industry-standard UVM library: component hierarchy, phasing, factory pattern, sequences, TLM, register abstraction layer (RAL).", estimated_days: 30, estimated_hours: 45, color: "#F59E0B", icon: "TestTube", prerequisites: ["systemverilog"] },
  { id: "rtl-design-fallback", name: "RTL Design & Synthesis", title: "RTL Design & Synthesis", slug: "rtl-design", order_index: 5, unlock_condition: "Pass Track 2 assessment >= 70%", description: "Practical RTL design: synchronous design principles, clock domain crossing (CDC), SDC constraints, Yosys open-source synthesis flow, DFT.", estimated_days: 25, estimated_hours: 40, color: "#EC4899", icon: "Layers", prerequisites: ["verilog"] },
  { id: "pd-fallback", name: "Physical Design & Backend", title: "Physical Design & Backend", slug: "physical-design", order_index: 6, unlock_condition: "Pass Track 5 assessment >= 70%", description: "Full OpenLane/Sky130 physical design flow: synthesis, floorplanning, placement, CTS, routing, signoff DRC/LVS, STA, and IR drop analysis.", estimated_days: 35, estimated_hours: 55, color: "#8B5CF6", icon: "Layers3", prerequisites: ["rtl-design"] },
  { id: "interview-fallback", name: "VLSI Interview Preparation", title: "VLSI Interview Preparation", slug: "interview-prep", order_index: 7, unlock_condition: "Pass Track 6 assessment >= 70%", description: "Technical and behavioral interview prep for top semiconductor companies. RTL design, verification, physical design, STA, DFT patterns.", estimated_days: 20, estimated_hours: 30, color: "#EF4444", icon: "Trophy", prerequisites: ["physical-design"] }
];

export async function getTracks(): Promise<LearningTrack[]> {
  if (!isConfigured || !supabase) {
    return FALLBACK_TRACKS;
  }
  try {
    // Try both table names: live DB might have 'academy_tracks' (v2 migration)
    // or 'learning_tracks' (v1 migration) depending on which was applied.
    let data: any[] | null = null;
    let error: any = null;

    const res1 = await supabase
      .from("academy_tracks")
      .select("*")
      .order("order_index", { ascending: true });
    
    if (!res1.error && res1.data && res1.data.length > 0) {
      data = res1.data;
    } else {
      // Fallback to the other table name
      const res2 = await supabase
        .from("learning_tracks")
        .select("*")
        .order("order_index", { ascending: true });
      data = res2.data;
      error = res2.error;
    }
    
    if (error || !data || data.length === 0) {
      return FALLBACK_TRACKS;
    }
    
    return data.map((t: any) => {
      const meta = TRACK_METADATA[t.name || t.title] || { slug: 'digital-logic', color: '#00E5FF', icon: 'Cpu', estimated_days: 15, estimated_hours: 25, prerequisites: [] };
      return {
        ...t,
        title: t.title || t.name,
        slug: t.slug || meta.slug,
        color: t.color || meta.color,
        icon: t.icon || meta.icon,
        estimated_days: t.estimated_days || meta.estimated_days,
        estimated_hours: t.estimated_hours || meta.estimated_hours,
        prerequisites: t.prerequisites || meta.prerequisites
      };
    }) as LearningTrack[];
  } catch (err) {
    return FALLBACK_TRACKS;
  }
}

export async function getTrackBySlug(slug: string): Promise<LearningTrack | null> {
  const tracks = await getTracks();
  return tracks.find(t => t.slug === slug || t.id === slug) || null;
}

export async function getDaysForTrack(trackId: string): Promise<LearningDay[]> {
  if (!isConfigured || !supabase) return [];
  try {
    // Try both table names
    const res1 = await supabase
      .from("academy_days")
      .select("id, track_id, day_number, title")
      .eq("track_id", trackId)
      .order("day_number", { ascending: true });
    
    if (!res1.error && res1.data && res1.data.length > 0) {
      return res1.data.map((d: any) => ({ ...d, key_concepts: [], estimated_minutes: 45, practice_links: [] })) as LearningDay[];
    }

    const res2 = await supabase
      .from("learning_days")
      .select("id, track_id, day_number, title, theory_summary")
      .eq("track_id", trackId)
      .order("day_number", { ascending: true });
    
    if (res2.error || !res2.data) return [];
    return res2.data.map((d: any) => ({ ...d, key_concepts: [], estimated_minutes: 45, practice_links: [] })) as LearningDay[];
  } catch (err) {
    return [];
  }
}

export async function getCompletedDays(userId: string | null): Promise<string[]> {
  if (!isConfigured || !supabase || !userId) return [];
  try {
    const { data: progress } = await supabase
      .from("user_learning_progress")
      .select("track_id, day_number")
      .eq("user_id", userId)
      .eq("status", "completed");
    if (!progress || progress.length === 0) return [];

    // Group by track_id to batch day UUID lookups
    const trackDayMap: Record<string, number[]> = {};
    for (const p of progress) {
      if (!trackDayMap[p.track_id]) trackDayMap[p.track_id] = [];
      trackDayMap[p.track_id].push(p.day_number);
    }

    const dayIds: string[] = [];
    for (const [trackId, dayNumbers] of Object.entries(trackDayMap)) {
      const { data: days } = await supabase
        .from("academy_days")
        .select("id")
        .eq("track_id", trackId)
        .in("day_number", dayNumbers);
      if (days) dayIds.push(...days.map((d: any) => d.id));
    }

    return dayIds;
  } catch {
    return [];
  }
}

export async function getPassedTracks(userId: string | null): Promise<TrackSlug[]> {
  if (!isConfigured || !supabase || !userId) return [];
  try {
    const { data: passedAssessments } = await supabase
      .from("user_learning_progress")
      .select("track_id")
      .eq("user_id", userId)
      .eq("day_number", 999)
      .eq("status", "completed");
    if (!passedAssessments || passedAssessments.length === 0) return [];
    const trackIds = passedAssessments.map((p: any) => p.track_id);
    const res1 = await supabase
      .from("academy_tracks")
      .select("slug")
      .in("id", trackIds);
    if (!res1.error && res1.data && res1.data.length > 0) {
      return res1.data.map((t: any) => t.slug as TrackSlug);
    }
    const res2 = await supabase
      .from("learning_tracks")
      .select("slug")
      .in("id", trackIds);
    if (!res2.error && res2.data) {
      return res2.data.map((t: any) => t.slug as TrackSlug);
    }
    return [];
  } catch {
    return [];
  }
}

export async function markDayComplete(userId: string | null, trackId: string, dayId: string, completed: boolean): Promise<boolean> {
  if (!isConfigured || !supabase || !userId) return false;
  try {
    const { data: day } = await supabase.from("academy_days").select("day_number").eq("id", dayId).single();
    if (!day) return false;
    const { error } = await supabase.from("user_learning_progress").upsert([{
      user_id: userId, track_id: trackId, day_number: day.day_number, status: completed ? "completed" : "in_progress", updated_at: new Date().toISOString()
    }], { onConflict: "user_id,track_id,day_number" });
    return !error;
  } catch { return false; }
}

export async function getDayDetails(trackSlug: string, dayNumber: number): Promise<any> {
  if (!isConfigured || !supabase) return null;
  try {
    const track = await getTrackBySlug(trackSlug);
    if (!track) return null;
    const { data: day } = await supabase.from("academy_days").select("*").eq("track_id", track.id).eq("day_number", dayNumber).single();
    if (!day) return null;
    return { track, day: { ...day, key_concepts: [], estimated_minutes: 45, practice_links: [] }, resources: [], questions: [] };
  } catch { return null; }
}

export async function getTrackCheckpoint(trackId: string): Promise<TrackCheckpoint | null> {
  if (!isConfigured || !supabase) return null;
  try {
    const { data } = await supabase.from("track_checkpoints").select("*").eq("track_id", trackId).single();
    return data as TrackCheckpoint || null;
  } catch { return null; }
}

export async function getTrackAssessment(trackId: string): Promise<any> {
  const cp = await getTrackCheckpoint(trackId);
  if (!cp) return null;
  const rawQuestions = cp.assessment_questions_ref || [];
  return {
    id: cp.id,
    track_id: cp.track_id,
    title: "Track Assessment",
    passing_score_percent: 80,
    time_limit_minutes: 30,
    questions: rawQuestions.map((q: any) => ({
      q: q.question,
      type: "mcq" as const,
      options: q.options || [],
      correct: q.correct_answer,
      exp: "",
    })),
  };
}

export async function getUserProgress(userId: string): Promise<UserProgressItem[]> {
  if (!isConfigured || !supabase || !userId) return [];
  try {
    const { data } = await supabase.from("user_learning_progress").select("*").eq("user_id", userId);
    return (data || []) as UserProgressItem[];
  } catch { return []; }
}

export async function saveUserProgress(userId: string, trackId: string, dayNumber: number, status: string, score?: number, capstoneSubmittedAt?: string): Promise<boolean> {
  if (!isConfigured || !supabase || !userId) return false;
  try {
    const payload: any = { user_id: userId, track_id: trackId, day_number: dayNumber, status, updated_at: new Date().toISOString() };
    if (score !== undefined) payload.checkpoint_score = score;
    const { error } = await supabase.from("user_learning_progress").upsert([payload], { onConflict: "user_id,track_id,day_number" });
    return !error;
  } catch { return false; }
}

export async function saveAssessmentResult(userId: string | null, trackId: string, trackSlug: string, score: number, passed: boolean, answers?: any): Promise<boolean> {
  if (!userId) return false;
  return saveUserProgress(userId, trackId, 999, passed ? "completed" : "in_progress", score);
}
