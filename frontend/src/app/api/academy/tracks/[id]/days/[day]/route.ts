import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { FALLBACK_TRACKS } from "@/lib/academy/queries";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; day: string } }
) {
  const { id, day } = params;
  const dayNumber = parseInt(day, 10) || 1;

  const track = FALLBACK_TRACKS.find((t) => t.slug === id || t.id === id) || FALLBACK_TRACKS[0];

  if (isAdminConfigured && supabaseAdmin) {
    try {
      let actualTrackId = id;
      const { data: trackRow } = await supabaseAdmin
        .from("academy_tracks")
        .select("id")
        .or(`id.eq.${id},slug.eq.${id}`)
        .maybeSingle();

      if (trackRow?.id) actualTrackId = trackRow.id;

      const { data: dayData } = await supabaseAdmin
        .from("academy_days")
        .select("*")
        .eq("track_id", actualTrackId)
        .eq("day_number", dayNumber)
        .maybeSingle();

      if (dayData) {
        return NextResponse.json({
          track,
          day: {
            ...dayData,
            key_concepts: dayData.key_concepts || [track.title, `Day ${dayNumber}`],
            estimated_minutes: dayData.estimated_minutes || 45,
            practice_links: dayData.practice_links || [],
          },
          resources: [],
          questions: [],
        });
      }
    } catch (err) {
      console.error("Error fetching day details from DB:", err);
    }
  }

  const generatedDay = {
    id: `${track.slug}-day-${dayNumber}`,
    track_id: track.id,
    day_number: dayNumber,
    title: `${track.title}: Day ${dayNumber} Foundations & Principles`,
    theory_summary: `## Overview & Objectives for Day ${dayNumber}

Welcome to Day ${dayNumber} of the **${track.title}** track! Today we focus on fundamental microelectronics concepts, practical hardware modeling, and industry-standard design practices.

### Key Learning Outcomes:
- **Theory & Concepts**: In-depth understanding of ${track.title} syntax, timing logic, and RTL design patterns.
- **Hands-on RTL Coding**: Writing synthesizable modules, testbenches, and verification components.
- **STA & Verification**: Identifying setup/hold timing constraints, clock domain hazards, and assertion coverage.

\`\`\`verilog
// Example synthesizable RTL module pattern for Day ${dayNumber}
module day${dayNumber}_counter #(
    parameter WIDTH = 8
)(
    input  wire             clk,
    input  wire             rst_n,
    input  wire             enable,
    output reg  [WIDTH-1:0] count
);

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      count <= {WIDTH{1'b0}};
    end else if (enable) begin
      count <= count + 1'b1;
    end
  end

endmodule
\`\`\`

### Summary Checklist:
- [x] Understand register-transfer level (RTL) semantics for synchronous reset.
- [x] Implement non-blocking assignments (\`<=\`) inside sequential procedural blocks.
- [x] Verify simulation wave outputs in ModelSim / Vivado / Icarus Verilog.`,
    key_concepts: [track.title, `Day ${dayNumber} Core`, "RTL Verification", "Timing Analysis"],
    estimated_minutes: 45,
    practice_links: [
      { label: "EDA Playground (Online Verilog IDE)", url: "https://www.edaplayground.com" },
      { label: "HDLBits Interactive Practice", url: "https://hdlbits.01xz.net" },
    ],
  };

  const sampleQuestions = [
    {
      id: `q-${dayNumber}-1`,
      question: `In Verilog/SystemVerilog RTL design, which type of assignment operator MUST be used for sequential logic inside an always @(posedge clk) block?`,
      options: [
        "Blocking assignment (=)",
        "Non-blocking assignment (<=)",
        "Continuous assignment (assign)",
        "Procedural force assignment",
      ],
      correct_answer: 1,
      explanation: "Non-blocking assignments (<=) schedule updates for the end of the current simulation timestep, preventing race conditions between sequential registers.",
    },
    {
      id: `q-${dayNumber}-2`,
      question: `What is the primary consequence of violating setup time ($t_{su}$) in a flip-flop?`,
      options: [
        "Metastability at the register output",
        "Higher static leakage current",
        "Permanent gate dielectric breakdown",
        "Increased clock frequency",
      ],
      correct_answer: 0,
      explanation: "Setup time violation prevents the data input from settling before the active clock edge, causing the flip-flop output to enter a metastable state.",
    },
  ];

  return NextResponse.json({
    track,
    day: generatedDay,
    resources: [],
    questions: sampleQuestions,
  });
}
