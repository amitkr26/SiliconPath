import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "International Fellowships for Electronics Researchers India 2026 | BerojgarDegreeWala",
  description: "Complete guide to DAAD Germany, SINGA Singapore, MEXT Japan, Marie Curie fellowships for Indian MSc electronics researchers. Eligibility, stipends, application deadlines.",
  alternates: { canonical: "https://berojgardegreewala.vercel.app/resources/international-fellowships" },
};

export default async function InternationalFellowshipsPage() {
  let intlOpps: any[] = [];
  if (supabaseAdmin?.from) {
    const { data } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .or(`location.ilike.%International%,tags.cs.{international}`)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) intlOpps = data;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/resources" className="text-cyan text-sm hover:underline mb-4 inline-block">&larr; Back to Resources</Link>
      <h1 className="font-display text-3xl font-bold text-text-primary mb-8">International Fellowship Programs for Indian Electronics Researchers 2026</h1>

      <div className="space-y-8 text-text-muted text-sm leading-relaxed">
        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">Why Consider International Research Fellowship?</h2>
          <p>International fellowships offer Indian electronics researchers exposure to world-class laboratories, higher stipends (€861-2,700/month abroad vs ₹37,000/month in India), global networking opportunities, and access to cutting-edge research infrastructure not yet available in India. These programs cover tuition, living expenses, and often include travel grants.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">DAAD Fellowship — Germany</h2>
          <p>DAAD (Deutscher Akademischer Austauschdienst) offers research grants for Indian MSc and PhD students to conduct research at German universities. The stipend is €861-1,200 per month plus travel allowance. Top German universities for electronics research include TU Dresden (nanotechnology, semiconductor devices), RWTH Aachen (power electronics, VLSI), and TU Munich (embedded systems, communications). Application window is typically September-November for the following academic year. Eligibility: MSc with strong academics, under 32 years, research proposal required.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">SINGA Fellowship — Singapore</h2>
          <p>The Singapore International Graduate Award (SINGA) is a fully-funded PhD program by A*STAR in collaboration with NUS, NTU, and SUTD. Stipend is SGD 2,000 per month. Research areas include semiconductor physics, materials science, photonics, and nanoelectronics. Application deadline is typically March-May each year. Eligibility: BTech/MSc with excellent academic records, strong research proposal, under 35 years. IELTS/TOEFL required.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">MEXT Research Student — Japan</h2>
          <p>The Japanese Government (MEXT) Scholarship offers research students from India the opportunity to study at Japanese universities. Stipend is ¥143,000 per month plus tuition waiver and travel. Application is through the Indian Embassy in New Delhi (April-June window). Eligibility: MSc in relevant field, under 35 years, must find a Japanese professor who agrees to supervise. Knowledge of Japanese is beneficial but not required for English-taught programs.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">Marie Curie / Erasmus Mundus — Europe</h2>
          <p>These EU fellowship programs offer research and PhD opportunities across multiple European universities. Marie Curie provides €2,700+ per month with family allowances. Erasmus Mundus offers joint master/PhD programs at 2-4 European universities. Application deadlines vary by program. Eligibility varies but typically requires MSc and under 35 years.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">Fellowship Comparison Table</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b border-gray-700"><th className="text-left py-2 px-3 text-text-primary">Fellowship</th><th className="text-left py-2 px-3 text-text-primary">Country</th><th className="text-left py-2 px-3 text-text-primary">Stipend</th><th className="text-left py-2 px-3 text-text-primary">Duration</th><th className="text-left py-2 px-3 text-text-primary">Deadline</th><th className="text-left py-2 px-3 text-text-primary">Eligibility</th></tr></thead>
              <tbody>
                <tr className="border-b border-gray-800"><td className="py-2 px-3">DAAD</td><td className="py-2 px-3">Germany</td><td className="py-2 px-3">€861-1,200/mo</td><td className="py-2 px-3">1-2 years</td><td className="py-2 px-3">Oct-Nov</td><td className="py-2 px-3">MSc, under 32</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3">SINGA</td><td className="py-2 px-3">Singapore</td><td className="py-2 px-3">SGD 2,000/mo</td><td className="py-2 px-3">4 years (PhD)</td><td className="py-2 px-3">Mar-May</td><td className="py-2 px-3">MSc/BE, strong academics</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2 px-3">MEXT</td><td className="py-2 px-3">Japan</td><td className="py-2 px-3">¥143,000/mo</td><td className="py-2 px-3">1.5-2 years</td><td className="py-2 px-3">Apr-Jun</td><td className="py-2 px-3">MSc, under 35</td></tr>
                <tr><td className="py-2 px-3">Marie Curie</td><td className="py-2 px-3">EU</td><td className="py-2 px-3">€2,700+/mo</td><td className="py-2 px-3">2-3 years</td><td className="py-2 px-3">Varies</td><td className="py-2 px-3">PhD or post-PhD</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-text-primary mb-3">How Indian Researchers Get International Fellowships — Tips</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Start early: Research proposals take 2-3 months to prepare</li>
            <li>Contact professors directly: Send concise, targeted emails with your CV</li>
            <li>Language: English proficiency is sufficient for most programs (IELTS 6.5+ or TOEFL 90+)</li>
            <li>Research proposal: Should align with the professor&apos;s ongoing work</li>
            <li>Publications: Even conference papers significantly strengthen your application</li>
            <li>Apply to multiple programs: DAAD, SINGA, and MEXT have different deadlines</li>
          </ul>
        </section>

        {intlOpps.length > 0 && (
          <section className="bg-navy-light border border-cyan/20 rounded-xl p-6">
            <h2 className="font-display text-xl font-bold text-text-primary mb-4">Current International Openings</h2>
            <div className="space-y-3">
              {intlOpps.map((opp: any) => (
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
