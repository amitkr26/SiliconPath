import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Complete JRF Guide 2026 — Electronics Science",
  description: "Everything about Junior Research Fellowship for electronics researchers: eligibility, stipend ₹37,000-42,000/month, age limit, how to apply, documents needed, DRDO ISRO CSIR openings.",
  alternates: { canonical: "https://berojgardegreewala.vercel.app/resources/jrf-guide" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is the JRF stipend in 2026?", acceptedAnswer: { "@type": "Answer", text: "JRF stipend is ₹37,000/month for first 2 years, ₹42,000/month as SRF for years 3-5 plus HRA and contingency." } },
    { "@type": "Question", name: "What is the age limit for JRF?", acceptedAnswer: { "@type": "Answer", text: "Maximum 28 years for General, 33 years for SC/ST/PwD/Women, 31 years for OBC-NCL." } },
    { "@type": "Question", name: "Do I need NET or GATE for JRF?", acceptedAnswer: { "@type": "Answer", text: "Yes, valid UGC-NET Electronic Science or GATE ECE is required for most JRF positions." } },
    { "@type": "Question", name: "How to apply for DRDO JRF?", acceptedAnswer: { "@type": "Answer", text: "Visit drdo.gov.in/careers for notifications. DRDO labs conduct walk-in interviews or accept applications through their portals." } },
    { "@type": "Question", name: "What is the difference between JRF and SRF?", acceptedAnswer: { "@type": "Answer", text: "JRF is entry-level (2 years, ₹37,000/month). SRF is promotion after 2 years or PhD entry (₹42,000/month)." } },
    { "@type": "Question", name: "How long does JRF last?", acceptedAnswer: { "@type": "Answer", text: "JRF tenure is typically 5 years total: 2 years as JRF + 3 years as SRF, subject to annual review." } },
    { "@type": "Question", name: "Can I do JRF without NET?", acceptedAnswer: { "@type": "Answer", text: "Some institutional JRFs at IITs, DRDO, and private research centers may accept candidates without NET through project-based appointments, but they are less common." } },
    { "@type": "Question", name: "What is the difference between CSIR JRF and UGC JRF?", acceptedAnswer: { "@type": "Answer", text: "CSIR-JRF is awarded through GATE score and is tenable only at CSIR labs leading to AcSIR PhD. UGC-JRF is awarded through UGC-NET and is tenable at any recognized Indian university or college." } },
  ],
};

export default async function JRFGuidePage() {
  let jrfOpps: any[] = [];
  if (supabaseAdmin?.from) {
    const { data } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .eq("category", "JRF")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) jrfOpps = data;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: "Complete JRF Guide 2026 — Electronics Science", description: "Everything about Junior Research Fellowship for electronics researchers", author: { "@type": "Organization", name: "BerojgarDegreeWala" } }) }} />

      <Link href="/resources" className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 text-sm font-semibold mb-4 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Resources</Link>
      <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-8">Junior Research Fellowship (JRF) Complete Guide 2026 — Electronics Science</h1>

      <div className="space-y-10 text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
        <section>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">What is JRF in Electronics?</h2>
          <p>Junior Research Fellowship (JRF) is a prestigious research position for postgraduate students holding MSc in Electronics, Physics, or related fields. JRFs work on funded research projects at premier institutions like DRDO labs, CSIR institutes, IITs, and NITs while pursuing their PhD. The fellowship provides a monthly stipend of ₹37,000 with HRA, enabling researchers to focus entirely on their work without financial concerns.</p>
          <p className="mt-2">Types of JRF include UGC-JRF (via NET), CSIR-JRF (via GATE), and institutional JRFs offered directly by research organizations for specific projects.</p>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">JRF Eligibility Criteria 2026</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Educational: MSc Electronics/Physics/Materials Science with 55% marks (50% for SC/ST/OBC/PwD)</li>
            <li>Age: Maximum 28 years for General, 33 years for SC/ST/PwD/Women</li>
            <li>Qualifying exam: UGC-NET Electronic Science OR GATE ECE (valid score required)</li>
            <li>Nationality: Indian citizen</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">JRF Stipend 2026 — How Much Will You Earn?</h2>
          <div className="overflow-x-auto bg-white border-2 border-slate-900 rounded-2xl shadow-brutal-sm">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b-2 border-slate-900 bg-slate-100"><th className="text-left py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-900">Component</th><th className="text-left py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-900">Amount</th></tr></thead>
              <tbody>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3">JRF Stipend (Year 1-2)</td><td className="py-2.5 px-3 text-blue-600 font-bold">₹37,000/month</td></tr>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3">SRF Stipend (Year 3-5)</td><td className="py-2.5 px-3 text-blue-600 font-bold">₹42,000/month</td></tr>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3">HRA (House Rent Allowance)</td><td className="py-2.5 px-3">10-30% of stipend (city dependent)</td></tr>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3">Annual Contingency</td><td className="py-2.5 px-3">₹20,000 (science stream)</td></tr>
                <tr><td className="py-2.5 px-3 font-semibold text-slate-900">Total Package (approx)</td><td className="py-2.5 px-3 text-blue-600 font-bold">₹5.5-6.5 LPA</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">Types of JRF in Electronics</h2>
          <div className="overflow-x-auto bg-white border-2 border-slate-900 rounded-2xl shadow-brutal-sm">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b-2 border-slate-900 bg-slate-100"><th className="text-left py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-900">Type</th><th className="text-left py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-900">Conducting Body</th><th className="text-left py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-900">Tenable At</th></tr></thead>
              <tbody>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3 font-semibold text-slate-900">UGC-NET JRF</td><td className="py-2.5 px-3">UGC / NTA</td><td className="py-2.5 px-3">Any recognized university/college</td></tr>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3 font-semibold text-slate-900">CSIR-JRF (GATE)</td><td className="py-2.5 px-3">CSIR HRDG</td><td className="py-2.5 px-3">CSIR labs only (AcSIR PhD)</td></tr>
                <tr className="border-b border-slate-200"><td className="py-2.5 px-3 font-semibold text-slate-900">DST-INSPIRE</td><td className="py-2.5 px-3">DST</td><td className="py-2.5 px-3">Any recognized institution</td></tr>
                <tr><td className="py-2.5 px-3 font-semibold text-slate-900">Institutional JRF</td><td className="py-2.5 px-3">DRDO/ISRO/IITs</td><td className="py-2.5 px-3">Specific to the institution</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">Documents Required for JRF Application</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Updated CV (2-4 pages)</li>
            <li>MSc marksheets (semester-wise) and degree certificate</li>
            <li>NET scorecard / GATE scorecard</li>
            <li>Date of birth proof (10th certificate)</li>
            <li>Category certificate (if applicable)</li>
            <li>Research experience certificate (if any)</li>
            <li>Publications list (if any)</li>
            <li>Passport size photographs</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">JRF Interview Process — What to Expect</h2>
          <p>The JRF selection process typically involves a written test followed by an interview. The written test covers subject knowledge in electronics (electronic devices, circuit theory, analog/digital electronics, VLSI basics). The interview panel assesses your research aptitude, academic background, and motivation. Be prepared to discuss your MSc project, research interests, and why you want to pursue this specific JRF.</p>
        </section>

        <section>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">Common Mistakes in JRF Applications</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Applying without checking eligibility criteria (age, qualification, NET/GATE validity)</li>
            <li>Submitting incomplete documents (missing marksheets, certificates)</li>
            <li>Generic cover letters — research area must match the project requirement</li>
            <li>Missing deadlines — most JRF positions have strict 21-30 day application windows</li>
            <li>Not preparing for the interview (technical knowledge + research proposal)</li>
          </ul>
        </section>

        <Card className="p-6">
          <h2 className="font-display text-xl font-black text-slate-900 mb-4">Current Open JRF Positions</h2>
          {jrfOpps.length > 0 ? (
            <div className="space-y-3">
              {jrfOpps.map((opp: any) => (
                <Link key={opp.id} href={`/opportunities/${opp.slug}`} className="block bg-white border-2 border-slate-900 rounded-xl p-3.5 shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <h3 className="text-slate-900 text-sm font-semibold">{opp.title}</h3>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">{opp.organization} {opp.deadline ? `• Deadline: ${new Date(opp.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""} {opp.stipend ? `• ${opp.stipend}` : ""}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-sm font-medium">No JRF positions currently listed. Check back soon.</p>
          )}
          <Link href="/opportunities?category=JRF" className="inline-flex items-center gap-1 text-blue-600 text-sm font-bold mt-4 hover:underline">View all JRF positions →</Link>
        </Card>
      </div>
    </div>
  );
}
