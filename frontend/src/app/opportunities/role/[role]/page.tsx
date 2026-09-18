import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPin, Briefcase } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isCurrentlyAvailable, computeIstToday } from "@/lib/availability";
import { evaluateProgrammaticGate } from "@/lib/seo/gate";
import { countProgrammatic } from "@/lib/seo/data-loader";
import OpportunityCard from "@/components/OpportunityCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SITE_URL } from "@/lib/seo/registry";

interface Props {
  params: { role: string };
}

function formatRole(role: string): string {
  return role
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Inline role definitions — kept in sync with BDW's deep-tech specialisation.
// These are editorial descriptions, not fabricated opportunity data.
const roleDescriptions: Record<string, { title: string; description: string; degrees: string[]; skills: string[] }> = {
  "physical-design": {
    title: "Physical Design",
    description: "Physical Design engineers convert gate-level netlists into optimized layout designs for ASICs and SoCs. They use standard-cell, full-custom, and mixed-signal flows to meet timing, power, and area targets.",
    degrees: ["M.Tech in VLSI", "B.E./B.Tech in Electronics", "M.S. in EE", "Ph.D. in VLSI"],
    skills: ["Verilog", "SystemVerilog", "Static Timing Analysis", "Place-and-Route", "DC Synthesis", "Library Characterization", "SPICE simulation"],
  },
  "rtl-design": {
    title: "RTL Design",
    description: "RTL Design engineers write hardware description language (HDL) code that defines the digital circuit behavior and structure. Their work is synthesized into gate-level netlists and forms the foundation for physical design implementation.",
    degrees: ["M.Tech in VLSI", "B.E./B.Tech in Electronics", "M.S. in EE"],
    skills: ["Verilog", "SystemVerilog", "UVM", "ACE", "FPGA prototyping", "Timing closure"],
  },
  "design-verification": {
    title: "Design Verification",
    description: "Verification engineers develop testbenches and verification IP to functionally and temporally validate RTL designs. They verify correctness against specifications using constrained-random and directed test methodologies.",
    degrees: ["M.Tech in VLSI", "B.E./B.Tech in Electronics", "M.S. in EE"],
    skills: ["SystemVerilog", "UVM", "VMM", "Assertion-based verification", "PlatformVerilog", "Covergroup", "Functional coverage"],
  },
  "dft": {
    title: "DFT (Design for Testability)",
    description: "DFT engineers add test infrastructure (scan chains, built-in self-test, logic BIST) to digital designs to facilitate automated test vector generation and chip bring-up validation at volume production.",
    degrees: ["M.Tech in VLSI", "B.E./B.Tech in Electronics", "M.S. in EE"],
    skills: ["SystemVerilog", "SCAN design", "BIST", "Test vector generation", "Pattern search", "Pattern delay fault"],
  },
  "embedded-systems": {
    title: "Embedded Systems",
    description: "Embedded Systems engineers develop firmware and real-time software for microcontrollers and SoCs. Their work involves bare-metal programming, RTOS integration, device drivers, and hardware-software co-verification.",
    degrees: ["B.E./B.Tech in Electronics", "M.Tech in Embedded Systems", "M.S. in Computer Engineering"],
    skills: ["C", "C++", "RTOS (FreeRTOS, VxWorks)", "ARM Cortex", "SPI/I2C/UART", "Debugbing with JTAG/GDB"],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { role } = params;
  const rd = roleDescriptions[role];
  if (!rd) {
    return { title: "Role Not Found" };
  }

  // Programmatic quality gate: role hubs with < 3 active verified
  // opportunities fail closed with noindex,follow.
  let robots;
  try {
    const gate = evaluateProgrammaticGate({ role }, await countProgrammatic({ role }));
    if (!gate?.indexable) robots = { index: false, follow: true } as const;
  } catch {
    robots = { index: false, follow: true } as const;
  }

  return {
    title: `${formatRole(role)} Jobs — ${rd.title}`,
    description: `Find ${formatRole(role).toLowerCase()} positions in semiconductor, VLSI, and electronics. Browse verified opportunities with eligibility, experience, organization, and application details.`,
    alternates: { canonical: `${SITE_URL}/opportunities/role/${role}` },
    ...(robots ? { robots } : {}),
  };
}

export default async function RoleHubPage({ params }: Props) {
  const { role } = params;
  const rd = roleDescriptions[role];
  if (!rd) notFound();

  const today = computeIstToday();
  let opportunities: any[] = [];

  if (supabaseAdmin?.from) {
    try {
      // Fetch all verified, active opportunities (no role filtering —
      // role is expressed via the page H1/intro, not a structured DB field).
      const { data } = await supabaseAdmin
        .from("opportunities")
        .select(
          "slug,title,category,location,description,stipend,application_url,deadline,verification_status,is_active,posted_at,posted_date,created_at,last_link_checked"
        )
        .eq("is_active", true)
        .eq("verification_status", "verified")
        .not("verification_status", "eq", "rejected")
        .not("verification_status", "eq", "pending")
        .not("verification_status", "eq", "expired")
        .not("verification_status", "eq", "link_unavailable");

      if (data) {
        opportunities = data
          .sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || ""));
      }
    } catch (err) {
      console.error("[Role Hub Data Error]:", err);
    }
  }

  const gate = evaluateProgrammaticGate({ role }, await countProgrammatic({ role }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap">
          <li>
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/opportunities" className="hover:text-slate-900 transition-colors">
              Opportunities
            </Link>
          </li>
          <li>/</li>
          <li className="text-slate-900" aria-current="page">
            {formatRole(role)}
          </li>
        </ol>
      </nav>

      <Link href="/opportunities" className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors text-sm mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" />
        All Opportunities
      </Link>

      {/* ROLE HEADER */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg border border-slate-200 flex items-center justify-center">
            <span className="text-2xl font-display font-bold text-slate-900">
              {formatRole(role).charAt(0)}
            </span>
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatRole(role)}
            </h1>
            <p className="text-slate-600 text-sm font-medium">
              {rd.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
          <span className="text-slate-400">
            <span className="font-medium">Relevant Degrees:</span>
            {rd.degrees.map((d, i) => (
              <span key={i} className="bg-slate-100 px-2 py-0.5 rounded mr-1">
                {d}
              </span>
            ))}
          </span>
          <span className="text-slate-400">
            <span className="font-medium">Common Skills:</span>
            {rd.skills.slice(0, 5).map((s, i) => (
              <span key={i} className="bg-slate-100 px-2 py-0.5 rounded mr-1">
                {s}
              </span>
            ))}
          </span>
        </div>

        {opportunities.length > 0 ? (
          <div className="mt-4">
            <p className="text-slate-600 text-sm font-medium mb-2">
              {opportunities.length} {opportunities.length === 1 ? "active opportunity" : "active opportunities"} found
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.map((opp: any) => (
                <OpportunityCard key={opp.slug} opportunity={opp} />
              ))}
            </div>
          </div>
        ) : (
          <Card className="text-center py-12 mb-12">
            <Briefcase className="w-12 h-12 text-blue-600/30 mx-auto mb-3" />
            <p className="text-slate-900 text-lg font-bold mb-1">
              No active positions right now
            </p>
            <p className="text-slate-500 text-sm font-medium">
              New positions are added daily. Check back soon or browse all opportunities below.
            </p>
            <div className="mt-4 flex justify-center">
              <Button href="/opportunities" variant="secondary">
                Browse All Opportunities
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}