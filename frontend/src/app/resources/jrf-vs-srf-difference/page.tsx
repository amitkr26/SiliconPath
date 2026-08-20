import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink, Calendar, IndianRupee, GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "JRF vs SRF vs Research Associate: What's the Difference?",
  description: "A complete comparison of Junior Research Fellow (JRF), Senior Research Fellow (SRF), and Research Associate (RA) positions in India. Stipends, eligibility, and progression.",
  alternates: { canonical: "https://berojgardegreewala.vercel.app/resources/jrf-vs-srf-difference" },
};

export default function JrfSrfDifferenceGuide() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the difference between JRF and SRF?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "JRF (Junior Research Fellow) is an entry-level research position (₹37,000/month) for fresh post-graduates. SRF (Senior Research Fellow) is a promotion granted after 2 years of JRF experience, offering a higher stipend (₹42,000/month) and more independent research responsibilities."
        }
      },
      {
        "@type": "Question",
        "name": "Can I apply directly for an SRF position?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, if you have an M.Tech/M.E. degree with 2 years of research experience, or an MSc with 2 years of JRF experience and publications, you can apply directly for open SRF positions."
        }
      }
    ]
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
      <Link href="/resources" className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors text-sm font-semibold mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Resources
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          JRF vs SRF vs Research Associate: What&apos;s the Difference?
        </h1>
        <div className="flex items-center gap-4 mt-4 text-slate-500 text-sm font-medium">
          <span>Updated: July 2026</span>
          <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> 5 min read</span>
        </div>
      </div>

      <div className="prose prose-slate max-w-none text-slate-700">
        <p className="text-lg text-slate-700 font-medium leading-relaxed border-l-4 border-blue-600 pl-4">
          <strong>The core difference:</strong> JRF (Junior Research Fellow) is the entry-level position for fresh graduates starting their PhD journey, SRF (Senior Research Fellow) is a promotion for experienced researchers midway through their PhD, and RA (Research Associate) is a post-doctoral position for those who have completed their PhD.
        </p>

        <h2 className="text-2xl font-black text-slate-900 mt-10 mb-4">1. Junior Research Fellow (JRF)</h2>
        <p>
          The Junior Research Fellowship is the starting point for a funded research career in India. It is typically awarded by agencies like CSIR, UGC, DST, or directly by institutions like DRDO and ISRO.
        </p>
        <ul className="space-y-2 mt-4 bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-brutal-sm list-none">
          <li className="flex items-start gap-2"><IndianRupee className="w-5 h-5 text-blue-600 shrink-0" /> <strong className="text-slate-900">2026 Stipend:</strong> ₹37,000 per month + HRA</li>
          <li className="flex items-start gap-2"><GraduationCap className="w-5 h-5 text-blue-600 shrink-0" /> <strong className="text-slate-900">Eligibility:</strong> MSc / BTech / BE + valid NET or GATE score.</li>
          <li className="flex items-start gap-2"><Calendar className="w-5 h-5 text-blue-600 shrink-0" /> <strong className="text-slate-900">Tenure:</strong> 2 years.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-500">
          <em>Citation: <a href="https://csirhrdg.res.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">CSIR HRDG Official Guidelines 2026 <ExternalLink className="inline w-3 h-3" /></a></em>
        </p>

        <h2 className="text-2xl font-black text-slate-900 mt-10 mb-4">2. Senior Research Fellow (SRF)</h2>
        <p>
          An SRF position requires demonstrated research capability. Most JRFs are automatically upgraded to SRF after two years, subject to an evaluation by a three-member committee.
        </p>
        <ul className="space-y-2 mt-4 bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-brutal-sm list-none">
          <li className="flex items-start gap-2"><IndianRupee className="w-5 h-5 text-blue-600 shrink-0" /> <strong className="text-slate-900">2026 Stipend:</strong> ₹42,000 per month + HRA</li>
          <li className="flex items-start gap-2"><GraduationCap className="w-5 h-5 text-blue-600 shrink-0" /> <strong className="text-slate-900">Eligibility:</strong> MTech/ME, or MSc/BTech with 2 years of JRF experience and publications.</li>
          <li className="flex items-start gap-2"><Calendar className="w-5 h-5 text-blue-600 shrink-0" /> <strong className="text-slate-900">Tenure:</strong> Up to 3 years (total JRF+SRF tenure cannot exceed 5 years).</li>
        </ul>

        <h2 className="text-2xl font-black text-slate-900 mt-10 mb-4">3. Research Associate (RA)</h2>
        <p>
          A Research Associate is a post-doctoral researcher capable of independent research and guiding junior fellows. There are three tiers of RAs based on experience.
        </p>
        <ul className="space-y-2 mt-4 bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-brutal-sm list-none">
          <li className="flex items-start gap-2"><IndianRupee className="w-5 h-5 text-blue-600 shrink-0" /> <strong className="text-slate-900">2026 Stipend:</strong> RA-I: ₹58,000, RA-II: ₹61,000, RA-III: ₹67,000 per month + HRA</li>
          <li className="flex items-start gap-2"><GraduationCap className="w-5 h-5 text-blue-600 shrink-0" /> <strong className="text-slate-900">Eligibility:</strong> PhD degree, or 3 years of research experience after MTech/ME with at least one research paper in an SCI journal.</li>
          <li className="flex items-start gap-2"><Calendar className="w-5 h-5 text-blue-600 shrink-0" /> <strong className="text-slate-900">Tenure:</strong> 1-3 years depending on the project.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-500">
          <em>Citation: <a href="https://dst.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">DST Fellowship Guidelines <ExternalLink className="inline w-3 h-3" /></a></em>
        </p>

        <hr className="border-slate-200 my-10" />

        <h2 className="text-xl font-black text-slate-900 mb-4">Frequently Asked Questions</h2>
        
        <h3 className="text-lg font-bold text-slate-900">What is the difference between JRF and SRF?</h3>
        <p>JRF (Junior Research Fellow) is an entry-level research position (₹37,000/month) for fresh post-graduates. SRF (Senior Research Fellow) is a promotion granted after 2 years of JRF experience, offering a higher stipend (₹42,000/month) and more independent research responsibilities.</p>

        <h3 className="text-lg font-bold text-slate-900 mt-6">Can I apply directly for an SRF position?</h3>
        <p>Yes, if you have an M.Tech/M.E. degree with 2 years of research experience, or an MSc with 2 years of JRF experience and publications, you can apply directly for open SRF positions without being a JRF first.</p>
      </div>
    </div>
  );
}
