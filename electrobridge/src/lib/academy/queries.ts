// src/lib/academy/queries.ts
import { supabase, isConfigured } from "../supabase";
import { LearningTrack, LearningDay, TrackCheckpoint, UserProgressItem, TrackSlug } from "./types";

const TRACK_METADATA: Record<string, { slug: TrackSlug; color: string; icon: string; estimated_days: number; estimated_hours: number; prerequisites: TrackSlug[] }> = {
  'Digital Logic Fundamentals': {
    slug: 'digital-logic',
    color: '#00E5FF',
    icon: 'Cpu',
    estimated_days: 30,
    estimated_hours: 45,
    prerequisites: []
  },
  'Verilog HDL': {
    slug: 'verilog',
    color: '#10B981',
    icon: 'Code2',
    estimated_days: 30,
    estimated_hours: 45,
    prerequisites: ['digital-logic']
  },
  'SystemVerilog for Verification': {
    slug: 'systemverilog',
    color: '#A855F7',
    icon: 'Shield',
    estimated_days: 30,
    estimated_hours: 45,
    prerequisites: ['verilog']
  },
  'Universal Verification Methodology (UVM)': {
    slug: 'uvm',
    color: '#F59E0B',
    icon: 'TestTube',
    estimated_days: 30,
    estimated_hours: 45,
    prerequisites: ['systemverilog']
  },
  'RTL Design & Synthesis': {
    slug: 'rtl-design',
    color: '#EC4899',
    icon: 'Layers',
    estimated_days: 25,
    estimated_hours: 40,
    prerequisites: ['verilog']
  },
  'Physical Design & Backend': {
    slug: 'physical-design',
    color: '#8B5CF6',
    icon: 'Layers3',
    estimated_days: 35,
    estimated_hours: 55,
    prerequisites: ['rtl-design']
  },
  'VLSI Interview Preparation': {
    slug: 'interview-prep',
    color: '#EF4444',
    icon: 'Trophy',
    estimated_days: 20,
    estimated_hours: 30,
    prerequisites: ['physical-design']
  }
};

export const FALLBACK_TRACKS: LearningTrack[] = [
  {
    id: "digital-logic-fallback",
    name: "Digital Logic Fundamentals",
    title: "Digital Logic Fundamentals",
    slug: "digital-logic",
    order_index: 1,
    unlock_condition: null,
    description: "Master number systems, Boolean algebra, K-maps, combinational and sequential circuit design, finite state machines, and timing analysis — the foundation of all VLSI design.",
    estimated_days: 30,
    estimated_hours: 45,
    color: "#00E5FF",
    icon: "Cpu",
    prerequisites: []
  },
  {
    id: "verilog-fallback",
    name: "Verilog HDL",
    title: "Verilog HDL",
    slug: "verilog",
    order_index: 2,
    unlock_condition: "Pass Track 1 (Digital Logic) assessment with >= 70%",
    description: "Learn hardware description and RTL design using Verilog. Covers module structure, dataflow/behavioral modeling, FSM design, testbenches, and industry coding guidelines.",
    estimated_days: 30,
    estimated_hours: 45,
    color: "#10B981",
    icon: "Code2",
    prerequisites: ["digital-logic"]
  },
  {
    id: "sv-fallback",
    name: "SystemVerilog for Verification",
    title: "SystemVerilog for Verification",
    slug: "systemverilog",
    order_index: 3,
    unlock_condition: "Pass Track 2 (Verilog) assessment with >= 70%",
    description: "Deep dive into SystemVerilog: OOP, constrained-random verification, functional coverage, assertions (SVA), and interface-based testbench architecture.",
    estimated_days: 30,
    estimated_hours: 45,
    color: "#A855F7",
    icon: "Shield",
    prerequisites: ["verilog"]
  },
  {
    id: "uvm-fallback",
    name: "Universal Verification Methodology (UVM)",
    title: "Universal Verification Methodology (UVM)",
    slug: "uvm",
    order_index: 4,
    unlock_condition: "Pass Track 3 (SystemVerilog) assessment with >= 70%",
    description: "Master the industry-standard UVM library: component hierarchy, phasing, factory pattern, sequences, TLM, register abstraction layer (RAL), and complete testbench architecture.",
    estimated_days: 30,
    estimated_hours: 45,
    color: "#F59E0B",
    icon: "TestTube",
    prerequisites: ["systemverilog"]
  },
  {
    id: "rtl-design-fallback",
    name: "RTL Design & Synthesis",
    title: "RTL Design & Synthesis",
    slug: "rtl-design",
    order_index: 5,
    unlock_condition: "Pass Track 2 or 4 (Verilog/UVM) assessment with >= 70%",
    description: "Practical RTL design: synchronous design principles, clock domain crossing (CDC), SDC constraints, Yosys open-source synthesis flow, DFT, and low-power design techniques.",
    estimated_days: 25,
    estimated_hours: 40,
    color: "#EC4899",
    icon: "Layers",
    prerequisites: ["verilog"]
  },
  {
    id: "pd-fallback",
    name: "Physical Design & Backend",
    title: "Physical Design & Backend",
    slug: "physical-design",
    order_index: 6,
    unlock_condition: "Pass Track 5 (RTL Design) assessment with >= 70%",
    description: "Full OpenLane/Sky130 physical design flow: synthesis, floorplanning, placement, CTS, routing, signoff DRC/LVS, STA, and IR drop analysis. Tape-out a complete design.",
    estimated_days: 35,
    estimated_hours: 55,
    color: "#8B5CF6",
    icon: "Layers3",
    prerequisites: ["rtl-design"]
  },
  {
    id: "interview-fallback",
    name: "VLSI Interview Preparation",
    title: "VLSI Interview Preparation",
    slug: "interview-prep",
    order_index: 7,
    unlock_condition: "Pass Track 6 (Physical Design) assessment with >= 70%",
    description: "Technical and behavioral interview prep for top semiconductor companies. Covering RTL design, verification, physical design, STA, DFT, and company-specific patterns.",
    estimated_days: 20,
    estimated_hours: 30,
    color: "#EF4444",
    icon: "Trophy",
    prerequisites: ["physical-design"]
  }
];

export async function getTracks(): Promise<LearningTrack[]> {
  if (!isConfigured || !supabase) {
    return FALLBACK_TRACKS;
  }
  try {
    const { data, error } = await supabase
      .from("learning_tracks")
      .select("*")
      .order("order_index", { ascending: true });
    
    if (error || !data || data.length === 0) {
      return FALLBACK_TRACKS;
    }
    
    return data.map((t: any) => {
      const meta = TRACK_METADATA[t.name] || { slug: 'digital-logic', color: '#00E5FF', icon: 'Cpu', estimated_days: 15, estimated_hours: 25, prerequisites: [] };
      return {
        ...t,
        title: t.name,
        slug: meta.slug,
        color: meta.color,
        icon: meta.icon,
        estimated_days: meta.estimated_days,
        estimated_hours: meta.estimated_hours,
        prerequisites: meta.prerequisites
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
    const { data, error } = await supabase
      .from("learning_days")
      .select("id, track_id, day_number, title, theory_summary")
      .eq("track_id", trackId)
      .order("day_number", { ascending: true });
    
    if (error) return [];
    
    return data.map((d: any) => ({
      ...d,
      key_concepts: ['VLSI', 'RTL'],
      estimated_minutes: 45,
      practice_links: []
    })) as LearningDay[];
  } catch (err) {
    return [];
  }
}

export async function getDayDetails(trackSlug: string, dayNumber: number): Promise<{
  track: LearningTrack;
  day: LearningDay;
  resources: any[];
  questions: any[];
} | null> {
  if (!isConfigured || !supabase) return null;
  try {
    const track = await getTrackBySlug(trackSlug);
    if (!track) return null;

    const { data: day, error } = await supabase
      .from("learning_days")
      .select("*")
      .eq("track_id", track.id)
      .eq("day_number", dayNumber)
      .single();
    
    if (error || !day) return null;

    const resources = day.video_ref ? [{
      id: "res-id",
      day_id: day.id,
      resource_type: 'youtube_video',
      youtube_video_id: day.video_ref,
      title: day.title,
      channel_name: "Neso Academy",
      channel_url: "https://www.youtube.com/@nesoacademy",
      watch_from_seconds: day.video_start_ts,
      watch_to_seconds: day.video_end_ts,
      notes: "Suggested lecture snippet"
    }] : [];

    const questions = (day.checkpoint_quiz || []).map((q: any, idx: number) => ({
      id: `q-${idx}`,
      day_id: day.id,
      question_type: 'mcq',
      question: q.question,
      options: q.options.map((opt: string) => ({ label: opt, value: opt })),
      correct_answer: q.correct_answer,
      explanation: "Correct answer: " + q.correct_answer,
      difficulty: 'medium'
    }));
    
    return {
      track,
      day: {
        ...day,
        key_concepts: ['VLSI', 'RTL'],
        estimated_minutes: 45,
        practice_links: day.practice_ref ? [{ label: 'Practice on EDA Playground', url: day.practice_ref, type: 'practice' }] : []
      } as LearningDay,
      resources,
      questions
    };
  } catch (err) {
    return null;
  }
}

export async function getTrackCheckpoint(trackId: string): Promise<TrackCheckpoint | null> {
  if (!isConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from("track_checkpoints")
      .select("*")
      .eq("track_id", trackId)
      .single();
    
    if (error) return null;
    return data as TrackCheckpoint;
  } catch (err) {
    return null;
  }
}

export async function getTrackAssessment(trackId: string): Promise<any> {
  const cp = await getTrackCheckpoint(trackId);
  if (!cp) return null;
  return {
    id: cp.id,
    track_id: cp.track_id,
    title: "Track Assessment Checkpoint",
    description: "Complete this assessment to unlock the next track.",
    passing_score_percent: 80,
    time_limit_minutes: 30,
    questions: (cp.assessment_questions_ref || []).map((q: any) => ({
      q: q.question,
      type: "mcq",
      options: q.options,
      correct: q.correct_answer,
      exp: "Refer to track lessons."
    }))
  };
}

export async function getUserProgress(userId: string): Promise<UserProgressItem[]> {
  if (!isConfigured || !supabase || !userId) return [];
  try {
    const { data, error } = await supabase
      .from("user_learning_progress")
      .select("*")
      .eq("user_id", userId);
    
    if (error) return [];
    return data as UserProgressItem[];
  } catch (err) {
    return [];
  }
}

export async function saveUserProgress(
  userId: string,
  trackId: string,
  dayNumber: number,
  status: 'in_progress' | 'completed',
  score?: number,
  capstoneSubmittedAt?: string
): Promise<boolean> {
  if (!isConfigured || !supabase || !userId) return false;
  try {
    const payload: any = {
      user_id: userId,
      track_id: trackId,
      day_number: dayNumber,
      status,
      updated_at: new Date().toISOString()
    };
    if (score !== undefined) payload.checkpoint_score = score;
    if (capstoneSubmittedAt !== undefined) payload.capstone_submitted_at = capstoneSubmittedAt;

    const { error } = await supabase
      .from("user_learning_progress")
      .upsert([payload], { onConflict: "user_id,track_id,day_number" });
    
    return !error;
  } catch (err) {
    return false;
  }
}

export async function saveAssessmentResult(
  userId: string | null,
  trackId: string,
  trackSlug: string,
  score: number,
  passed: boolean,
  answers?: any
): Promise<boolean> {
  if (!isConfigured || !supabase || !userId) return false;
  try {
    return await saveUserProgress(
      userId,
      trackId,
      999, // special flag day for track exam passing
      passed ? "completed" : "in_progress",
      score,
      answers ? new Date().toISOString() : undefined
    );
  } catch {
    return false;
  }
}

export async function getCompletedDays(userId: string | null): Promise<string[]> {
  if (!isConfigured || !supabase || !userId) return [];
  try {
    const { data, error } = await supabase
      .from("user_learning_progress")
      .select("day_number, track_id")
      .eq("user_id", userId)
      .eq("status", "completed");
    if (error || !data) return [];
    
    const { data: days } = await supabase.from("learning_days").select("id, track_id, day_number");
    const completedIds: string[] = [];
    data.forEach((p: any) => {
      const match = days?.find((d: any) => d.track_id === p.track_id && d.day_number === p.day_number);
      if (match) completedIds.push(match.id);
    });
    return completedIds;
  } catch {
    return [];
  }
}

export async function getPassedTracks(userId: string | null): Promise<TrackSlug[]> {
  if (!isConfigured || !supabase || !userId) return [];
  try {
    const { data, error } = await supabase
      .from("user_learning_progress")
      .select("track_id, day_number, status")
      .eq("user_id", userId)
      .eq("status", "completed");
    if (error || !data) return [];
    
    const tracks = await getTracks();
    const passed: TrackSlug[] = [];
    for (const track of tracks) {
      const finishedMax = data.some((p: any) => p.track_id === track.id && p.day_number === 999 && p.status === "completed");
      if (finishedMax) {
        passed.push(track.slug);
      }
    }
    return passed;
  } catch {
    return [];
  }
}

export async function markDayComplete(
  userId: string | null,
  trackId: string,
  dayId: string,
  completed: boolean
): Promise<boolean> {
  if (!isConfigured || !supabase || !userId) return false;
  try {
    const { data: day, error } = await supabase
      .from("learning_days")
      .select("day_number")
      .eq("id", dayId)
      .single();
    if (error || !day) return false;
    return await saveUserProgress(userId, trackId, day.day_number, completed ? "completed" : "in_progress");
  } catch {
    return false;
  }
}
