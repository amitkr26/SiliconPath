import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "VLSI Career India 2026 — Jobs, Salaries, Skills & Companies",
  description: "Complete VLSI career guide for India 2026. RTL design, physical design, verification jobs. Companies: Intel, Qualcomm, AMD, TI. Salaries ₹5-50 LPA. Skills: Verilog, SystemVerilog, Cadence.",
  alternates: { canonical: "https://berojgardegreewala.vercel.app/resources/vlsi-careers" },
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
      <Link href="/resources" className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 text-sm font-semibold mb-4 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Resources</Link>
      <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-8">VLSI Career Roadmap India 2026 — Complete Guide for Electronics Engineers</h1>

      <div className="space-y-10 text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
        <section>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">VLSI Industry in India 2026</h2>
          <p>India is home to 20% of the world&apos;s chip designers, with Bangalore as the primary hub housing over 100 semiconductor design centers. The India Semiconductor Mission (ISM) with ₹1.6 lakh crore in committed investments is creating unprecedented opportunities. Tata Electronics is setting up India&apos;s first fab in Dholera, Micron is building an assembly plant in Gujarat, and all major global semiconductor companies have significant R&D centers in India.</p>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">VLSI Job Roles — Which Path is Right for You?</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-slate-900">RTL Design</strong>: Writing hardware in Verilog/SystemVerilog. Salary ₹6-15 LPA fresh. Requires strong digital design fundamentals.</li>
            <li><strong className="text-slate-900">Physical Design</strong>: Floorplan, place & route, timing closure. Salary ₹7-18 LPA fresh. Requires EDA tool knowledge (Synopsys ICC2, Cadence Innovus).</li>
            <li><strong className="text-slate-900">Verification</strong>: UVM, coverage-driven verification. Salary ₹6-14 LPA fresh. Highest demand role.</li>
            <li><strong className="text-slate-900">DFT</strong>: Scan insertion, ATPG, boundary scan. Salary ₹7-15 LPA.</li>
            <li><strong className="text-slate-900">Analog/Mixed Signal</strong>: Circuit design (op-amps, PLLs, ADCs). Salary ₹8-20 LPA. Requires strong analog fundamentals.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">Top Companies Hiring VLSI Engineers in India</h2>
          <div className="overflow-x-auto bg-white border-2 border-slate-900 rounded-2xl shadow-brutal-sm">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b-2 border-slate-900 bg-slate-100"><th className="text-left py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-900">Company</th><th className="text-left py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-900">Primary Location</th><th className="text-left py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-900">Key Roles</th></tr></thead>
              <tbody>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3 font-semibold text-slate-900">Intel</td><td className="py-2.5 px-3">Bangalore, Hyderabad</td><td className="py-2.5 px-3">RTL, PD, DFT, Verification</td></tr>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3 font-semibold text-slate-900">Qualcomm</td><td className="py-2.5 px-3">Bangalore, Hyderabad, Chennai</td><td className="py-2.5 px-3">RTL, Verification, Analog</td></tr>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3 font-semibold text-slate-900">AMD</td><td className="py-2.5 px-3">Bangalore, Hyderabad</td><td className="py-2.5 px-3">RTL, PD, Verification, DFT</td></tr>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3 font-semibold text-slate-900">Texas Instruments</td><td className="py-2.5 px-3">Bangalore, Chennai</td><td className="py-2.5 px-3">Analog, Mixed Signal, PDK</td></tr>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3 font-semibold text-slate-900">Synopsys</td><td className="py-2.5 px-3">Bangalore, Hyderabad, Noida</td><td className="py-2.5 px-3">EDA, RTL, Verification, PD</td></tr>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3 font-semibold text-slate-900">Cadence</td><td className="py-2.5 px-3">Bangalore, Noida</td><td className="py-2.5 px-3">EDA, Custom IC, Allegro</td></tr>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3 font-semibold text-slate-900">Nvidia</td><td className="py-2.5 px-3">Bangalore, Hyderabad</td><td className="py-2.5 px-3">GPU Design, Verification</td></tr>
                <tr><td className="py-2.5 px-3 font-semibold text-slate-900">Micron</td><td className="py-2.5 px-3">Hyderabad, Bangalore</td><td className="py-2.5 px-3">Memory Design, Product Eng</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">Salary Guide — VLSI India 2026</h2>
          <div className="overflow-x-auto bg-white border-2 border-slate-900 rounded-2xl shadow-brutal-sm">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b-2 border-slate-900 bg-slate-100"><th className="text-left py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-900">Experience</th><th className="text-left py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-900">Role</th><th className="text-left py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-900">Salary Range</th></tr></thead>
              <tbody>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3">0-1 year (fresher)</td><td className="py-2.5 px-3">RTL/Verification</td><td className="py-2.5 px-3 text-blue-600 font-bold">₹5-12 LPA</td></tr>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3">2-4 years</td><td className="py-2.5 px-3">RTL/PD/DFT</td><td className="py-2.5 px-3 text-blue-600 font-bold">₹12-25 LPA</td></tr>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3">5-8 years</td><td className="py-2.5 px-3">Senior Engineer</td><td className="py-2.5 px-3 text-blue-600 font-bold">₹25-45 LPA</td></tr>
                <tr><td className="py-2.5 px-3">10+ years</td><td className="py-2.5 px-3">Lead/Principal</td><td className="py-2.5 px-3 text-blue-600 font-bold">₹45-80 LPA</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">Skills Required for VLSI Jobs 2026</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-slate-900">Languages</strong>: Verilog, SystemVerilog, VHDL, C/C++, Python (for EDA scripting)</li>
            <li><strong className="text-slate-900">Tools</strong>: Synopsys Design Compiler, ICC2, PrimeTime; Cadence Genus, Innovus, Virtuoso</li>
            <li><strong className="text-slate-900">Concepts</strong>: Digital design, STA, low-power design, DFT (scan, ATPG, BIST), UVM verification</li>
            <li><strong className="text-slate-900">Certifications</strong>: NPTEL VLSI courses, VSD training programs, Cadence academic certifications</li>
          </ul>
        </section>

        {vlsiOpps.length > 0 && (
          <Card className="p-6">
            <h2 className="font-display text-xl font-black text-slate-900 mb-4">Current Private Sector Openings</h2>
            <div className="space-y-3">
              {vlsiOpps.map((opp: any) => (
                <Link key={opp.id} href={`/opportunities/${opp.slug}`} className="block bg-white border-2 border-slate-900 rounded-xl p-3.5 shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <h3 className="text-slate-900 text-sm font-semibold">{opp.title}</h3>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">{opp.organization} {opp.location ? `— ${opp.location}` : ""} {opp.stipend ? `— ${opp.stipend}` : ""}</p>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
