import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "VLSI Career India 2026 — Jobs, Salaries, Skills & Companies | ElectroBridge",
  description: "Complete VLSI career guide for India 2026. RTL design, physical design, verification jobs. Companies: Intel, Qualcomm, AMD, TI. Salaries ₹5-50 LPA. Skills: Verilog, SystemVerilog, Cadence.",
  alternates: { canonical: "https://electrobridge.vercel.app/resources/vlsi-careers" },
};

export default async function VLSICareersPage() {
  let vlsiOpps: any[] = [];
  if (supabaseAdmin?.from) {
    const { data } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .eq("category", "Private Job")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) vlsiOpps = data;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/resources" className="text-cyan text-sm hover:underline mb-4 inline-block">&larr; Back to Resources</Link>
      <h1 className="font-display text-3xl font-bold text-text-primary mb-8">VLSI Career Roadmap India 2026 — Complete Guide for Electronics Engineers</h1>

      <div className="space-y-8 text-text-muted text-sm leading-relaxed">
        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">VLSI Industry in India 2026</h2>
          <p>India is home to 20% of the world&apos;s chip designers, with Bangalore as the primary hub housing over 100 semiconductor design centers. The India Semiconductor Mission (ISM) with ₹1.6 lakh crore in committed investments is creating unprecedented opportunities. Tata Electronics is setting up India&apos;s first fab in Dholera, Micron is building an assembly plant in Gujarat, and all major global semiconductor companies have significant R&D centers in India.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">VLSI Job Roles — Which Path is Right for You?</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-text-primary">RTL Design</strong>: Writing hardware in Verilog/SystemVerilog. Salary ₹6-15 LPA fresh. Requires strong digital design fundamentals.</li>
            <li><strong className="text-text-primary">Physical Design</strong>: Floorplan, place & route, timing closure. Salary ₹7-18 LPA fresh. Requires EDA tool knowledge (Synopsys ICC2, Cadence Innovus).</li>
            <li><strong className="text-text-primary">Verification</strong>: UVM, coverage-driven verification. Salary ₹6-14 LPA fresh. Highest demand role.</li>
            <li><strong className="text-text-primary">DFT</strong>: Scan insertion, ATPG, boundary scan. Salary ₹7-15 LPA.</li>
            <li><strong className="text-text-primary">Analog/Mixed Signal</strong>: Circuit design (op-amps, PLLs, ADCs). Salary ₹8-20 LPA. Requires strong analog fundamentals.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">Top Companies Hiring VLSI Engineers in India</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b border-gray-700"><th className="text-left py-2 px-3 text-text-primary">Company</th><th className="text-left py-2 px-3 text-text-primary">Primary Location</th><th className="text-left py-2 px-3 text-text-primary">Key Roles</th></tr></thead>
              <tbody>
                <tr className="border-b border-gray-800"><td className="py-2 px-3">Intel</td><td className="py-2 px-3">Bangalore, Hyderabad</td><td className="py-2 px-3">RTL, PD, DFT, Verification</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3">Qualcomm</td><td className="py-2 px-3">Bangalore, Hyderabad, Chennai</td><td className="py-2 px-3">RTL, Verification, Analog</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3">AMD</td><td className="py-2 px-3">Bangalore, Hyderabad</td><td className="py-2 px-3">RTL, PD, Verification, DFT</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3">Texas Instruments</td><td className="py-2 px-3">Bangalore, Chennai</td><td className="py-2 px-3">Analog, Mixed Signal, PDK</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3">Synopsys</td><td className="py-2 px-3">Bangalore, Hyderabad, Noida</td><td className="py-2 px-3">EDA, RTL, Verification, PD</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3">Cadence</td><td className="py-2 px-3">Bangalore, Noida</td><td className="py-2 px-3">EDA, Custom IC, Allegro</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3">Nvidia</td><td className="py-2 px-3">Bangalore, Hyderabad</td><td className="py-2 px-3">GPU Design, Verification</td></tr>
                <tr><td className="py-2 px-3">Micron</td><td className="py-2 px-3">Hyderabad, Bangalore</td><td className="py-2 px-3">Memory Design, Product Eng</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">Salary Guide — VLSI India 2026</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b border-gray-700"><th className="text-left py-2 px-3 text-text-primary">Experience</th><th className="text-left py-2 px-3 text-text-primary">Role</th><th className="text-left py-2 px-3 text-text-primary">Salary Range</th></tr></thead>
              <tbody>
                <tr className="border-b border-gray-800"><td className="py-2 px-3">0-1 year (fresher)</td><td className="py-2 px-3">RTL/Verification</td><td className="py-2 px-3 text-cyan font-medium">₹5-12 LPA</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3">2-4 years</td><td className="py-2 px-3">RTL/PD/DFT</td><td className="py-2 px-3 text-cyan font-medium">₹12-25 LPA</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3">5-8 years</td><td className="py-2 px-3">Senior Engineer</td><td className="py-2 px-3 text-cyan font-medium">₹25-45 LPA</td></tr>
                <tr><td className="py-2 px-3">10+ years</td><td className="py-2 px-3">Lead/Principal</td><td className="py-2 px-3 text-cyan font-medium">₹45-80 LPA</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">Skills Required for VLSI Jobs 2026</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-text-primary">Languages</strong>: Verilog, SystemVerilog, VHDL, C/C++, Python (for EDA scripting)</li>
            <li><strong className="text-text-primary">Tools</strong>: Synopsys Design Compiler, ICC2, PrimeTime; Cadence Genus, Innovus, Virtuoso</li>
            <li><strong className="text-text-primary">Concepts</strong>: Digital design, STA, low-power design, DFT (scan, ATPG, BIST), UVM verification</li>
            <li><strong className="text-text-primary">Certifications</strong>: NPTEL VLSI courses, VSD training programs, Cadence academic certifications</li>
          </ul>
        </section>

        {vlsiOpps.length > 0 && (
          <section className="bg-navy-light border border-cyan/20 rounded-xl p-6">
            <h2 className="font-display text-xl font-bold text-text-primary mb-4">Current Private Sector Openings</h2>
            <div className="space-y-3">
              {vlsiOpps.map((opp: any) => (
                <Link key={opp.id} href={`/opportunities/${opp.slug}`} className="block bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-cyan/30 transition-colors">
                  <h3 className="text-text-primary text-sm font-medium">{opp.title}</h3>
                  <p className="text-text-muted text-xs mt-0.5">{opp.organization} {opp.location ? `• ${opp.location}` : ""} {opp.stipend ? `• ${opp.stipend}` : ""}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
