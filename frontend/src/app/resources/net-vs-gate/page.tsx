import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "UGC-NET vs GATE for Electronics Research — Complete Comparison 2026 | BerojgarDegreeWala",
  description: "Complete comparison of UGC-NET Electronic Science vs GATE ECE for electronics research careers. Which exam opens JRF, which leads to PSU jobs, stipend comparison, difficulty analysis.",
  alternates: { canonical: "https://berojgardegreewala.vercel.app/resources/net-vs-gate" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Which is better for JRF — NET or GATE?", acceptedAnswer: { "@type": "Answer", text: "Both qualify for JRF but through different routes. UGC-NET opens JRF at universities/colleges (UGC-JRF). GATE opens CSIR-JRF at CSIR labs leading to AcSIR PhD. The stipend is the same ₹37,000/month for both." } },
    { "@type": "Question", name: "Can I appear for both NET and GATE?", acceptedAnswer: { "@type": "Answer", text: "Yes, many candidates appear for both. UGC-NET is held in June/December, GATE in February. The syllabi overlap significantly (70-80% common topics in Electronic Science/ECE)." } },
    { "@type": "Question", name: "Which exam is harder — NET or GATE?", acceptedAnswer: { "@type": "Answer", text: "GATE ECE is generally considered more competitive due to higher number of applicants and wider syllabus. UGC-NET Electronic Science has a narrower syllabus focused on research-oriented electronics topics." } },
    { "@type": "Question", name: "What is the stipend for NET-JRF vs GATE-JRF?", acceptedAnswer: { "@type": "Answer", text: "Both UGC-NET JRF and CSIR-GATE JRF offer the same stipend: ₹37,000/month during JRF period (first 2 years) and ₹42,000/month as SRF (years 3-5). Both also include HRA and contingency grants." } },
    { "@type": "Question", name: "Can I become a professor with GATE?", acceptedAnswer: { "@type": "Answer", text: "No, GATE does not qualify you for assistant professor positions. Only UGC-NET (or state-level SET) qualifies candidates for assistant professor roles in Indian universities and colleges." } },
    { "@type": "Question", name: "What are the age limits for NET and GATE JRF?", acceptedAnswer: { "@type": "Answer", text: "UGC-NET JRF: 30 years for General (relaxation for OBC/SC/ST). GATE CSIR-JRF: 28 years for General (33 for SC/ST, 31 for OBC). Age is calculated from the date of the exam notification." } },
  ],
};

export default async function NetVsGatePage() {
  let relevantOpps: any[] = [];
  if (supabaseAdmin?.from) {
    const { data } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .or("tags.cs.{NET},tags.cs.{GATE}")
      .order("created_at", { ascending: false })
      .limit(8);
    if (data) relevantOpps = data;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Link href="/resources" className="text-cyan text-sm hover:underline mb-4 inline-block">&larr; Back to Resources</Link>
      <h1 className="font-display text-3xl font-bold text-text-primary mb-8">UGC-NET vs GATE for Electronics Research — Which Should You Choose?</h1>

      <div className="space-y-8 text-text-muted text-sm leading-relaxed">
        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">What is UGC-NET Electronic Science?</h2>
          <p>The National Eligibility Test (NET) for Electronic Science is conducted by the National Testing Agency (NTA) on behalf of the University Grants Commission (UGC). It is the primary gateway for Indian researchers to secure a Junior Research Fellowship (JRF) tenable at any recognized university or college. NET-qualified candidates can also apply for assistant professor positions. The exam covers 8 core units of electronics research and is held twice a year (June and December).</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">What is GATE ECE?</h2>
          <p>The Graduate Aptitude Test in Engineering (GATE) for Electronics & Communication Engineering (ECE) is conducted jointly by IISc and IITs. GATE scores qualify candidates for CSIR-JRF at CSIR laboratories (NPL, CEERI, etc.) leading to an AcSIR PhD. GATE is also the primary entrance for M.Tech admissions at IITs, NITs, and other institutions, and is used by PSUs like BSNL, ISRO, DRDO, IOCL, and BARC for recruitment. GATE is held once a year in February.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">Comparison Table</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-text-primary">Factor</th>
                  <th className="text-left py-2 px-3 text-text-primary">UGC-NET Electronic Science</th>
                  <th className="text-left py-2 px-3 text-text-primary">GATE ECE</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800"><td className="py-2 px-3 font-medium text-text-primary">Conducted by</td><td className="py-2 px-3">NTA (UGC)</td><td className="py-2 px-3">IIT/IISc</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3 font-medium text-text-primary">Frequency</td><td className="py-2 px-3">Twice yearly (June/Dec)</td><td className="py-2 px-3">Once yearly (Feb)</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3 font-medium text-text-primary">Qualifies for</td><td className="py-2 px-3">JRF + Assistant Professor</td><td className="py-2 px-3">CSIR-JRF + PSU + M.Tech</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3 font-medium text-text-primary">Age limit</td><td className="py-2 px-3">30 years for JRF</td><td className="py-2 px-3">28 years for CSIR-JRF</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3 font-medium text-text-primary">Stipend (JRF)</td><td className="py-2 px-3 text-cyan font-semibold">₹37,000/month</td><td className="py-2 px-3 text-cyan font-semibold">₹37,000/month</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3 font-medium text-text-primary">Stipend (SRF)</td><td className="py-2 px-3 text-cyan font-semibold">₹42,000/month</td><td className="py-2 px-3 text-cyan font-semibold">₹42,000/month</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3 font-medium text-text-primary">Validity</td><td className="py-2 px-3">3 years (JRF)</td><td className="py-2 px-3">3 years</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3 font-medium text-text-primary">Difficulty</td><td className="py-2 px-3">Moderate</td><td className="py-2 px-3">High</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3 font-medium text-text-primary">Syllabus width</td><td className="py-2 px-3">Narrower, research-focused</td><td className="py-2 px-3">Wider, engineering-focused</td></tr>
                <tr><td className="py-2 px-3 font-medium text-text-primary">Tenable at</td><td className="py-2 px-3">Any university/college</td><td className="py-2 px-3">CSIR labs only (AcSIR)</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">Which to Choose by Career Goal</h2>
          <div className="space-y-3">
            <div className="bg-navy-light border border-gray-700 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-text-primary font-medium">Choose NET if you want UGC-JRF at any university</p>
                <p className="text-text-muted text-xs mt-1">NET opens JRF positions at any recognized Indian university, giving you maximum flexibility in choosing your research institution and supervisor.</p>
              </div>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-text-primary font-medium">Choose GATE if you want CSIR lab specifically</p>
                <p className="text-text-muted text-xs mt-1">GATE opens CSIR-JRF positions at CSIR labs like NPL, CEERI, CSIO, and CMERI, with PhD through AcSIR. Ideal if you want to work in a national lab environment.</p>
              </div>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-text-primary font-medium">Choose GATE if you want PSU job + research option</p>
                <p className="text-text-muted text-xs mt-1">GATE scores are used by PSUs like BSNL, IOCL, GAIL, NTPC, and BARC for recruitment. You can also use your GATE score for M.Tech admissions as a backup.</p>
              </div>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-text-primary font-medium">Choose NET if you want teaching + research</p>
                <p className="text-text-muted text-xs mt-1">Only NET qualifies you for assistant professor positions. If you want the option to teach at a university while doing research, NET is your clear choice.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">Can You Appear for Both?</h2>
          <p className="mb-3">Yes, and many successful researchers do exactly that. The syllabi of UGC-NET Electronic Science and GATE ECE overlap by 70-80%, so preparing for one naturally helps with the other. Here is a strategy:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-text-primary">Start with GATE preparation</strong> (January-February exam) — the wider syllabus covers most NET topics plus additional engineering concepts.</li>
            <li><strong className="text-text-primary">After GATE, focus on NET-specific topics</strong> like research methodology, teaching aptitude (Paper 1), and any electronics topics not covered in GATE.</li>
            <li><strong className="text-text-primary">Appear for NET in June</strong> (or December) — the extra 4 months after GATE gives you ample time to prepare for NET Paper 1.</li>
            <li><strong className="text-text-primary">Result</strong>: You potentially have both UGC-JRF and CSIR-JRF offers, maximizing your options for PhD in electronics.</li>
          </ul>
        </section>

        <section className="bg-navy-light border border-cyan/20 rounded-xl p-6">
          <h2 className="font-display text-xl font-bold text-text-primary mb-4">Live Openings Requiring NET or GATE</h2>
          {relevantOpps.length > 0 ? (
            <div className="space-y-3">
              {relevantOpps.map((opp: any) => (
                <Link key={opp.id} href={`/opportunities/${opp.slug}`} className="block bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-cyan/30 transition-colors">
                  <h3 className="text-text-primary text-sm font-medium">{opp.title}</h3>
                  <p className="text-text-muted text-xs mt-0.5">{opp.organization}{opp.stipend ? ` • ${opp.stipend}` : ""}{opp.deadline ? ` • Deadline: ${new Date(opp.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No NET/GATE-specific opportunities listed currently.</p>
          )}
          <Link href="/opportunities" className="inline-flex items-center gap-1 text-cyan text-sm font-medium mt-4 hover:underline">Browse all opportunities <ArrowRight className="w-3.5 h-3.5" /></Link>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">FAQs</h2>
          <div className="space-y-4">
            <div className="bg-navy-light border border-gray-700 rounded-xl p-4">
              <p className="font-medium text-text-primary mb-1">Which is better for JRF — NET or GATE?</p>
              <p>Both are equally good but serve different paths. NET opens UGC-JRF at any university; GATE opens CSIR-JRF at CSIR labs. The stipend is identical (₹37,000/month). Choose based on where you want to do your PhD.</p>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl p-4">
              <p className="font-medium text-text-primary mb-1">Can I appear for both NET and GATE?</p>
              <p>Yes, many candidates do. NET is in June/December, GATE in February. Syllabus overlap is 70-80%, so preparing for one helps with the other.</p>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl p-4">
              <p className="font-medium text-text-primary mb-1">Which exam is harder?</p>
              <p>GATE ECE is more competitive due to more applicants and broader syllabus. NET Electronic Science has a narrower, research-focused syllabus.</p>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl p-4">
              <p className="font-medium text-text-primary mb-1">What is the stipend?</p>
              <p>Both offer ₹37,000/month (JRF) and ₹42,000/month (SRF) plus HRA and contingency — the exact same pay scale.</p>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl p-4">
              <p className="font-medium text-text-primary mb-1">Can I become a professor with GATE?</p>
              <p>No, only NET (or state SET) qualifies you for assistant professor positions. GATE does not confer teaching eligibility.</p>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl p-4">
              <p className="font-medium text-text-primary mb-1">What are the age limits?</p>
              <p>NET JRF: 30 years for General. GATE CSIR-JRF: 28 years for General. Relaxation available for OBC/SC/ST/Women.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
