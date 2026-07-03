import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { ArrowRight, GraduationCap, BookOpen, Award, Calendar, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "PhD in Electronics India 2026 — Admission Guide | ElectroBridge",
  description: "Complete PhD admission guide for electronics researchers in India. IIT, IISc, TIFR, IISER, CSIR labs. Funding options, stipends, application process. Everything you need to know.",
  alternates: { canonical: "https://electrobridge.vercel.app/resources/phd-guide" },
};

const TOP_INSTITUTIONS = [
  { name: "IISc Bangalore", strengths: "VLSI, nanoelectronics, photonics, signal processing", window: "Feb-Mar (KVPY channel), Oct-Dec (direct)", stipend: "₹37,000-70,000" },
  { name: "IIT Bombay", strengths: "RF & microwave, embedded systems, AI hardware, communications", window: "Mar-Apr, Oct-Nov", stipend: "₹31,000-70,000" },
  { name: "IIT Delhi", strengths: "VLSI design, optical communication, MEMS, power electronics", window: "Apr-Jun, Nov-Dec", stipend: "₹31,000-70,000" },
  { name: "IIT Madras", strengths: "Semiconductor devices, antenna design, control systems, IoT", window: "Apr-May, Oct-Nov", stipend: "₹31,000-70,000" },
  { name: "IISER Pune", strengths: "Quantum electronics, photonics, materials science, sensors", window: "Nov-Dec", stipend: "₹31,000-37,000" },
  { name: "TIFR Mumbai", strengths: "Condensed matter physics, laser electronics, quantum computing", window: "Dec-Jan", stipend: "₹37,000-42,000" },
  { name: "CSIR-NPL Delhi", strengths: "Semiconductor metrology, nanoelectronics, quantum standards", window: "Year-round (AcSIR)", stipend: "₹37,000-42,000" },
];

export default async function PhDGuidePage() {
  let phdOpps: any[] = [];
  if (supabaseAdmin?.from) {
    const { data } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .eq("category", "PhD")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) phdOpps = data;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/resources" className="text-cyan text-sm hover:underline mb-4 inline-block">&larr; Back to Resources</Link>
      <h1 className="font-display text-3xl font-bold text-text-primary mb-8">PhD in Electronics India 2026 — Complete Admission Guide</h1>

      <div className="space-y-8 text-text-muted text-sm leading-relaxed">
        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">PhD Admission Routes in India</h2>
          <p className="mb-4">There are three main routes to secure a PhD position in electronics in India, depending on your qualifications and career goals:</p>
          <div className="space-y-4">
            <div className="bg-navy-light border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-cyan" />
                <h3 className="font-display text-base font-bold text-text-primary">Route 1: GATE/NET Fellowship</h3>
              </div>
              <p>Clear GATE (ECE) or UGC-NET (Electronic Science) to qualify for JRF. Use the fellowship to pursue PhD at CSIR labs (AcSIR), IITs, IISc, or universities. This is the most common route — you get a stipend of ₹37,000/month from day one of your PhD.</p>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-cyan" />
                <h3 className="font-display text-base font-bold text-text-primary">Route 2: Direct Institute PhD Entrance Exam</h3>
              </div>
              <p>Many IITs, IISc, IISERs, and TIFR conduct their own PhD entrance exams. You apply directly to the institute, appear for their test, and if selected, receive an institute fellowship. No prior GATE/NET required, though a valid score strengthens your application.</p>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-cyan" />
                <h3 className="font-display text-base font-bold text-text-primary">Route 3: JRF-to-PhD (Project-based)</h3>
              </div>
              <p>Apply directly for JRF positions on research projects at DRDO, ISRO, CSIR labs, or IITs. After joining as a JRF on a funded project, you can register for PhD at the host institution (often through AcSIR for CSIR labs or the institute&apos;s PhD program for IITs).</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">Top Institutions for Electronics PhD</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-text-primary">Institution</th>
                  <th className="text-left py-2 px-3 text-text-primary">Research Strengths</th>
                  <th className="text-left py-2 px-3 text-text-primary">Application Window</th>
                  <th className="text-left py-2 px-3 text-text-primary">Stipend</th>
                </tr>
              </thead>
              <tbody>
                {TOP_INSTITUTIONS.map((inst, i) => (
                  <tr key={inst.name} className={i < TOP_INSTITUTIONS.length - 1 ? "border-b border-gray-800" : ""}>
                    <td className="py-2 px-3 font-medium text-text-primary">{inst.name}</td>
                    <td className="py-2 px-3">{inst.strengths}</td>
                    <td className="py-2 px-3 text-cyan">{inst.window}</td>
                    <td className="py-2 px-3 text-cyan font-semibold">{inst.stipend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">Funding Options & Stipends</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-text-primary">Fellowship</th>
                  <th className="text-left py-2 px-3 text-text-primary">Stipend</th>
                  <th className="text-left py-2 px-3 text-text-primary">Tenable At</th>
                  <th className="text-left py-2 px-3 text-text-primary">Key Requirement</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800"><td className="py-2 px-3 font-medium text-text-primary">CSIR JRF</td><td className="py-2 px-3 text-cyan font-semibold">₹37,000/mo</td><td className="py-2 px-3">CSIR labs</td><td className="py-2 px-3">GATE score</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3 font-medium text-text-primary">UGC JRF</td><td className="py-2 px-3 text-cyan font-semibold">₹37,000/mo</td><td className="py-2 px-3">Any university</td><td className="py-2 px-3">UGC-NET</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3 font-medium text-text-primary">DST-INSPIRE</td><td className="py-2 px-3 text-cyan font-semibold">₹31,000/mo</td><td className="py-2 px-3">Any institution</td><td className="py-2 px-3">Top 1% in MSc</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3 font-medium text-text-primary">PMRF</td><td className="py-2 px-3 text-cyan font-semibold">₹70,000-80,000/mo</td><td className="py-2 px-3">IITs, IISc, central univs</td><td className="py-2 px-3">Institute selection</td></tr>
                <tr><td className="py-2 px-3 font-medium text-text-primary">Institute Fellowship</td><td className="py-2 px-3 text-cyan font-semibold">₹25,000-37,000/mo</td><td className="py-2 px-3">IITs, IISERs, NITs</td><td className="py-2 px-3">Institute PhD entrance</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">All fellowships include annual contingency grants (₹10,000-₹20,000) and HRA (10-30% of stipend depending on city). PMRF is the most prestigious with the highest stipend but is limited to the top 3000 research scholars nationally.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">How to Contact Professors (Email Template)</h2>
          <p className="mb-3">Before applying to a PhD program, it is critical to contact potential supervisors. Professors receive dozens of emails — here is a template that works:</p>
          <div className="bg-navy-light border border-gray-700 rounded-xl p-4 font-mono text-xs leading-relaxed">
            <p className="text-text-primary mb-2"><strong>Subject:</strong> PhD Inquiry — [Your Name] — Electronics — [Research Area]</p>
            <p>Dear Prof. [Last Name],</p>
            <p className="mt-2">I am writing to express my interest in pursuing a PhD in [specific area] under your guidance at [Institution].</p>
            <p className="mt-2">I recently completed my MSc in Electronics from [University] with [grade/percentage]. I have a valid GATE score of [score] (AIR [rank]). My MSc thesis was on [topic], and I am particularly interested in [specific sub-field related to your work].</p>
            <p className="mt-2">I have read your recent papers on [specific paper/topic] and would love to contribute to your ongoing research in this area.</p>
            <p className="mt-2">Could I please know if you are accepting PhD students for the [semester/session] intake? I have attached my CV and academic transcripts for your reference.</p>
            <p className="mt-2">Thank you for your time.</p>
            <p>Best regards,<br />[Your Full Name]<br />[Your Email] | [Your Phone]</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">Application Timeline Calendar</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-navy-light border border-gray-700 rounded-xl p-4">
              <Calendar className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-text-primary font-medium">July-August</p>
                <p className="text-xs mt-0.5">Prepare for GATE/NET. Start reaching out to professors via email. Research potential supervisors and read their recent publications.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-navy-light border border-gray-700 rounded-xl p-4">
              <Calendar className="w-5 h-5 text-cyan mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-text-primary font-medium">September-December</p>
                <p className="text-xs mt-0.5">Submit PhD applications for spring admissions. Most IITs open their PhD portal during this period. IISc and TIFR have their application windows open.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-navy-light border border-gray-700 rounded-xl p-4">
              <Calendar className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-text-primary font-medium">January-February</p>
                <p className="text-xs mt-0.5">Give GATE exam. Attend PhD interviews at institutes. Monitor DRDO/CSIR JRF notifications.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-navy-light border border-gray-700 rounded-xl p-4">
              <Calendar className="w-5 h-5 text-cyan mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-text-primary font-medium">March-April</p>
                <p className="text-xs mt-0.5">GATE results out. Main PhD admission cycle for July intake. Apply for CSIR-JRF via GATE score. Most IITs conduct written tests and interviews.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-navy-light border border-gray-700 rounded-xl p-4">
              <Calendar className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-text-primary font-medium">May-June</p>
                <p className="text-xs mt-0.5">UGC-NET exam. Final admission offers for July intake. Prepare for PhD program start.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-navy-light border border-gray-700 rounded-xl p-4">
              <Calendar className="w-5 h-5 text-cyan mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-text-primary font-medium">July-August</p>
                <p className="text-xs mt-0.5">PhD program begins (July intake). Start applications for December intake (IISc, some IITs).</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-navy-light border border-cyan/20 rounded-xl p-6">
          <h2 className="font-display text-xl font-bold text-text-primary mb-4">Current PhD Openings</h2>
          {phdOpps.length > 0 ? (
            <div className="space-y-3">
              {phdOpps.map((opp: any) => (
                <Link key={opp.id} href={`/opportunities/${opp.slug}`} className="block bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-cyan/30 transition-colors">
                  <h3 className="text-text-primary text-sm font-medium">{opp.title}</h3>
                  <p className="text-text-muted text-xs mt-0.5">{opp.organization}{opp.stipend ? ` • ${opp.stipend}` : ""}{opp.deadline ? ` • Deadline: ${new Date(opp.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No PhD positions currently listed. Check back soon or browse all opportunities.</p>
          )}
          <Link href="/opportunities?category=PhD" className="inline-flex items-center gap-1 text-cyan text-sm font-medium mt-4 hover:underline">View all PhD positions <ArrowRight className="w-3.5 h-3.5" /></Link>
        </section>
      </div>
    </div>
  );
}
