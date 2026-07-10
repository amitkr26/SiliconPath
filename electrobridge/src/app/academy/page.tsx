import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import ErrorBoundary from "@/components/ErrorBoundary";
import AcademyTracks from "@/components/academy/AcademyTracks";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "VLSI Academy",
  description:
    "Free self-paced VLSI curriculum: 7 sequential tracks from digital logic to interview prep, with curated resources and gated assessments.",
};

const FALLBACK_TRACKS = [
  { slug: "digital-logic", title: "Digital Logic Fundamentals", description: "Boolean algebra, combinational and sequential circuits, FSMs, timing analysis.", order_index: 1, estimated_days: 14, estimated_hours: 28, prerequisites: [] as string[] },
  { slug: "verilog", title: "Verilog HDL", description: "Behavioral and structural modeling, testbenches, synthesis-aware RTL, FPGA flow.", order_index: 2, estimated_days: 21, estimated_hours: 42, prerequisites: ["digital-logic"] },
  { slug: "systemverilog", title: "SystemVerilog for Verification", description: "OOP, constrained random, functional coverage, assertions, interfaces.", order_index: 3, estimated_days: 21, estimated_hours: 45, prerequisites: ["verilog"] },
  { slug: "uvm", title: "Universal Verification Methodology", description: "UVM architecture, sequences, drivers, monitors, scoreboards, RAL.", order_index: 4, estimated_days: 28, estimated_hours: 56, prerequisites: ["systemverilog"] },
  { slug: "rtl-design", title: "RTL Design & Synthesis", description: "Microarchitecture, pipelining, CDC, synthesis constraints, timing/area tradeoffs.", order_index: 5, estimated_days: 21, estimated_hours: 40, prerequisites: ["verilog"] },
  { slug: "physical-design", title: "Physical Design & Backend", description: "Floorplanning, placement, CTS, routing, STA, IR-drop, DRC/LVS, signoff.", order_index: 6, estimated_days: 28, estimated_hours: 50, prerequisites: ["rtl-design"] },
  { slug: "interview-prep", title: "VLSI Interview Preparation", description: "Core question bank, mock interviews, resume, company-specific prep.", order_index: 7, estimated_days: 14, estimated_hours: 30, prerequisites: ["rtl-design"] },
];

async function getTracks() {
  try {
    if (!supabaseAdmin) return FALLBACK_TRACKS;
    const { data } = await supabaseAdmin
      .from("academy_tracks")
      .select("slug, title, description, order_index, estimated_days, estimated_hours, prerequisites")
      .eq("is_active", true)
      .order("order_index", { ascending: true });
    return data && data.length > 0 ? data : FALLBACK_TRACKS;
  } catch {
    return FALLBACK_TRACKS;
  }
}

export default async function AcademyPage() {
  const tracks = await getTracks();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-12 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[oklch(95%_0.025_155)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[oklch(45%_0.14_155)]">
          100% Free · Self-Paced · No Login Required
        </span>
        <h1 className="text-3xl font-black sm:text-4xl">VLSI Academy</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-text-secondary">
          Master digital design from fundamentals to interview prep. 7 sequential tracks, curated free lectures, and gated assessments to verify your progress.
        </p>
      </div>

      <ErrorBoundary>
        <AcademyTracks tracks={tracks} />
      </ErrorBoundary>
    </div>
  );
}
