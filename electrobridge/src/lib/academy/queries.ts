// src/lib/academy/queries.ts
import { supabase, isConfigured } from "../supabase";
import { LearningTrack, LearningDay, LearningResource, LearningQuestion, TrackAssessment, TrackSlug } from "./types";

// Mock/Fallback data for tracks in case DB fails or is empty
export const FALLBACK_TRACKS: LearningTrack[] = [
  {
    id: "digital-logic-id",
    slug: "digital-logic",
    title: "Digital Logic Fundamentals",
    description: "Master the foundational building blocks of all digital systems: number systems, Boolean algebra, combinational circuits (MUX, decoder, adder), sequential circuits (flip-flops, registers, counters), and Finite State Machine design. This track is the prerequisite for everything else — complete it first.",
    short_description: "Number systems, Boolean algebra, combinational & sequential logic, FSMs",
    order_index: 1,
    estimated_days: 30,
    estimated_hours: 45,
    color: "#00E5FF",
    icon: "Cpu",
    prerequisites: [],
    is_published: true
  },
  {
    id: "verilog-id",
    slug: "verilog",
    title: "Verilog HDL",
    description: "Learn Hardware Description Language from the ground up. Cover gate-level, dataflow, and behavioral modeling, write synthesizable RTL code, build testbenches, and simulate designs with industry-standard tools. Based on NPTEL/IIT Kharagpur curriculum + structured practice.",
    short_description: "Gate-level, behavioral modeling, testbenches, simulation",
    order_index: 2,
    estimated_days: 30,
    estimated_hours: 50,
    color: "#A855F7",
    icon: "Code2",
    prerequisites: ["digital-logic"],
    is_published: true
  },
  {
    id: "systemverilog-id",
    slug: "systemverilog",
    title: "SystemVerilog for Verification",
    description: "Extend Verilog with SystemVerilog constructs used in modern verification: OOP classes, randomization with constraints, virtual interfaces, functional coverage, SystemVerilog Assertions (SVA), and basic verification architecture patterns.",
    short_description: "OOP, randomization, SVA assertions, functional coverage",
    order_index: 3,
    estimated_days: 30,
    estimated_hours: 55,
    color: "#EC4899",
    icon: "Shield",
    prerequisites: ["verilog"],
    is_published: true
  },
  {
    id: "uvm-id",
    slug: "uvm",
    title: "Universal Verification Methodology (UVM)",
    description: "Industry-standard verification framework used in 95% of VLSI companies. Learn UVM component hierarchy (agent, driver, monitor, scoreboard), factory override, sequences, TLM ports, and end-to-end testbench architecture. Includes hands-on EDA Playground exercises.",
    short_description: "UVM hierarchy, sequences, factory, TLM, full testbench",
    order_index: 4,
    estimated_days: 30,
    estimated_hours: 60,
    color: "#F59E0B",
    icon: "TestTube",
    prerequisites: ["systemverilog"],
    is_published: true
  },
  {
    id: "rtl-design-id",
    slug: "rtl-design",
    title: "RTL Design & Synthesis",
    description: "Design synthesizable RTL for real chip flows: coding style best practices, synchronous design principles, clock domain crossing (CDC), timing constraints (SDC), logic synthesis with open-source tools (Yosys), and reading synthesis reports.",
    short_description: "Synthesizable RTL, CDC, SDC constraints, Yosys synthesis",
    order_index: 5,
    estimated_days: 25,
    estimated_hours: 45,
    color: "#10B981",
    icon: "Layers",
    prerequisites: ["verilog"],
    is_published: true
  },
  {
    id: "physical-design-id",
    slug: "physical-design",
    title: "Physical Design & Backend",
    description: "The complete chip implementation flow from netlist to GDSII using open-source tools (OpenLane, Magic, ngspice, SkyWater 130nm PDK — no paid license required). Covers floorplanning, placement, clock tree synthesis (CTS), routing, STA signoff, DRC/LVS.",
    short_description: "OpenLane flow, floorplan, CTS, routing, STA, DRC/LVS",
    order_index: 6,
    estimated_days: 35,
    estimated_hours: 70,
    color: "#F97316",
    icon: "Layers3",
    prerequisites: ["rtl-design"],
    is_published: true
  },
  {
    id: "interview-prep-id",
    slug: "interview-prep",
    title: "VLSI Interview Preparation",
    description: "Structured preparation for VLSI job interviews at companies like Intel, Qualcomm, MediaTek, Samsung, NVIDIA, and Indian semiconductor startups. Covers technical topics (digital design, verification, PD), behavioral questions, and company-specific patterns.",
    short_description: "Technical MCQs, coding rounds, behavioral prep, company patterns",
    order_index: 7,
    estimated_days: 20,
    estimated_hours: 35,
    color: "#6366F1",
    icon: "Trophy",
    prerequisites: ["digital-logic"],
    is_published: true
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
      console.warn("Using fallback tracks due to DB error/empty table:", error);
      return FALLBACK_TRACKS;
    }
    return data as LearningTrack[];
  } catch (err) {
    console.error("Failed to fetch tracks from DB:", err);
    return FALLBACK_TRACKS;
  }
}

export async function getTrackBySlug(slug: string): Promise<LearningTrack | null> {
  const tracks = await getTracks();
  return tracks.find(t => t.slug === slug) || null;
}

export async function getDaysForTrack(trackId: string): Promise<LearningDay[]> {
  if (!isConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from("learning_days")
      .select("id, track_id, day_number, title, key_concepts, estimated_minutes, practice_links")
      .eq("track_id", trackId)
      .order("day_number", { ascending: true });
    
    if (error) {
      console.error("Error fetching days:", error);
      return [];
    }
    return data as LearningDay[];
  } catch (err) {
    console.error("Failed to fetch days:", err);
    return [];
  }
}

export async function getDayDetails(trackSlug: string, dayNumber: number): Promise<{
  track: LearningTrack;
  day: LearningDay;
  resources: LearningResource[];
  questions: LearningQuestion[];
} | null> {
  if (!isConfigured || !supabase) return null;
  try {
    const track = await getTrackBySlug(trackSlug);
    if (!track) return null;

    const { data: dayData, error: dayError } = await supabase
      .from("learning_days")
      .select("*")
      .eq("track_id", track.id)
      .eq("day_number", dayNumber)
      .single();

    if (dayError || !dayData) {
      console.error(`Day ${dayNumber} not found for track ${trackSlug}`, dayError);
      return null;
    }

    const { data: resources, error: resError } = await supabase
      .from("learning_resources")
      .select("*")
      .eq("day_id", dayData.id)
      .order("order_index", { ascending: true });

    const { data: questions, error: qError } = await supabase
      .from("learning_questions")
      .select("*")
      .eq("day_id", dayData.id)
      .order("order_index", { ascending: true });

    return {
      track,
      day: dayData as LearningDay,
      resources: (resources || []) as LearningResource[],
      questions: (questions || []) as LearningQuestion[]
    };
  } catch (err) {
    console.error("Failed to get day details:", err);
    return null;
  }
}

export async function getTrackAssessment(trackId: string): Promise<TrackAssessment | null> {
  if (!isConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from("track_assessments")
      .select("*")
      .eq("track_id", trackId)
      .single();

    if (error) {
      console.error("Error fetching track assessment:", error);
      return null;
    }
    return data as TrackAssessment;
  } catch (err) {
    console.error("Failed to fetch track assessment:", err);
    return null;
  }
}

// User-level state handlers (fallbacks to localStorage if user is not logged in)
export async function getCompletedDays(userId: string | null): Promise<string[]> {
  if (!userId || !isConfigured || !supabase) {
    // Return from LocalStorage if in client side
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("sp_academy_completed_days");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("user_learning_progress")
      .select("day_id")
      .eq("user_id", userId);
    
    if (error) return [];
    return data.map((d: any) => d.day_id);
  } catch {
    return [];
  }
}

export async function getPassedTracks(userId: string | null): Promise<TrackSlug[]> {
  if (!userId || !isConfigured || !supabase) {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("sp_academy_passed_tracks");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("user_track_assessment_results")
      .select("track_id, passed")
      .eq("user_id", userId)
      .eq("passed", true);
    
    if (error || !data) return [];
    
    // Resolve track ids to slugs
    const tracks = await getTracks();
    const passedSlugs: TrackSlug[] = [];
    data.forEach((item: any) => {
      const match = tracks.find(t => t.id === item.track_id);
      if (match && !passedSlugs.includes(match.slug)) {
        passedSlugs.push(match.slug);
      }
    });
    return passedSlugs;
  } catch {
    return [];
  }
}

export async function markDayComplete(userId: string | null, trackId: string, dayId: string, completed: boolean): Promise<boolean> {
  if (!userId || !isConfigured || !supabase) {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("sp_academy_completed_days");
        let list: string[] = stored ? JSON.parse(stored) : [];
        if (completed) {
          if (!list.includes(dayId)) list.push(dayId);
        } else {
          list = list.filter(id => id !== dayId);
        }
        localStorage.setItem("sp_academy_completed_days", JSON.stringify(list));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  try {
    if (completed) {
      const { error } = await supabase
        .from("user_learning_progress")
        .upsert({ user_id: userId, track_id: trackId, day_id: dayId }, { onConflict: "user_id,day_id" });
      return !error;
    } else {
      const { error } = await supabase
        .from("user_learning_progress")
        .delete()
        .eq("user_id", userId)
        .eq("day_id", dayId);
      return !error;
    }
  } catch {
    return false;
  }
}

export async function saveAssessmentResult(
  userId: string | null, 
  trackId: string, 
  trackSlug: TrackSlug,
  scorePercent: number, 
  passed: boolean,
  answersJson: any
): Promise<boolean> {
  if (!userId || !isConfigured || !supabase) {
    if (typeof window !== "undefined") {
      try {
        if (passed) {
          const stored = localStorage.getItem("sp_academy_passed_tracks");
          const list: string[] = stored ? JSON.parse(stored) : [];
          if (!list.includes(trackSlug)) {
            list.push(trackSlug);
            localStorage.setItem("sp_academy_passed_tracks", JSON.stringify(list));
          }
        }
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  try {
    const { error } = await supabase
      .from("user_track_assessment_results")
      .insert({
        user_id: userId,
        track_id: trackId,
        score_percent: scorePercent,
        passed,
        answers_json: answersJson
      });
    return !error;
  } catch {
    return false;
  }
}
