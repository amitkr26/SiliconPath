import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink, ShieldAlert, Target, FileText, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "DRDO Recruitment Process for Electronics Engineers: Complete Guide",
  description: "Learn how to join DRDO as an Electronics Engineer or Scientist 'B'. Complete syllabus, RAC exam details, and interview preparation guide.",
  alternates: { canonical: "https://berojgardegreewala.vercel.app/resources/drdo-recruitment-electronics" },
};

export default function DrdoRecruitmentGuide() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How can an electronics engineer join DRDO?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Electronics Engineers typically join DRDO as Scientist 'B' through the Recruitment and Assessment Centre (RAC). The process involves shortlisting via a valid GATE score in ECE, followed by a written descriptive exam, and finally a rigorous technical interview."
        }
      },
      {
        "@type": "Question",
        "name": "Is GATE mandatory for DRDO Scientist B recruitment?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, a valid GATE score is usually mandatory for shortlisting candidates for the written exam. However, candidates with an 8.0+ CGPA from IITs or NITs are sometimes exempted from the GATE requirement and called directly for the written test."
        }
      }
    ]
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
      <Link href="/resources" className="inline-flex items-center gap-1 text-slate-600 hover:text-accent transition-colors text-xs font-bold mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Resources
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge tone="accent">Defence R&amp;D Guide</Badge>
          <Badge tone="neutral">Scientist &apos;B&apos;</Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">
          DRDO Recruitment Process for Electronics Engineers: Complete Guide
        </h1>
        <div className="flex items-center gap-4 mt-3 text-slate-500 text-xs font-bold">
          <span>Updated: July 2026</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> 6 min read</span>
        </div>
      </div>

      <div className="space-y-8 text-slate-800 text-sm leading-relaxed font-medium">
        <div className="bg-blue-50/60 border border-slate-200 rounded-xl p-5 shadow-card">
          <p className="text-base text-slate-900 font-bold">
            <strong>The Core Pathway:</strong> Joining the Defence Research and Development Organisation (DRDO) as a Scientist &apos;B&apos; requires clearing a three-stage process managed by the Recruitment and Assessment Centre (RAC): GATE Shortlisting &rarr; Written Exam &rarr; Personal Interview.
          </p>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">1. Eligibility Criteria (Electronics / ECE)</h2>
          <Card className="p-6">
            <ul className="space-y-3 list-none">
              <li className="flex items-start gap-2.5">
                <GraduationCap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Degree:</strong> First Class Bachelor&apos;s Degree (B.E. / B.Tech) in Electronics &amp; Communication Engg, Electronics Engg, or equivalent from a recognized university.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Target className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>GATE:</strong> Must possess a valid GATE score in Electronics and Communication Engineering (EC).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Age Limit:</strong> Unreserved (UR): 28 years, OBC (NCL): 31 years, SC/ST: 33 years.</span>
              </li>
            </ul>
          </Card>
          <p className="mt-2 text-xs text-slate-500 font-semibold">
            <em>Note: IIT/NIT graduates with a minimum CGPA of 8.0/10 are often eligible to apply without a GATE score.</em>
          </p>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">2. The 3-Stage Selection Process</h2>
          
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-base font-bold text-slate-900 mb-1">Stage 1: Shortlisting</h3>
              <p className="text-xs sm:text-sm text-slate-700">
                Candidates are shortlisted for the written examination based on their GATE scores. The ratio is typically 1:25 (25 candidates called for the written test for every 1 vacancy).
              </p>
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-bold text-slate-900 mb-1">Stage 2: Written Examination</h3>
              <p className="text-xs sm:text-sm text-slate-700">
                Unlike the objective-type GATE exam, the DRDO RAC written exam is usually a <strong>descriptive (subjective) paper</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2 text-xs sm:text-sm text-slate-700">
                <li><strong>Format:</strong> Two papers (Paper I and Paper II), similar to the UPSC Engineering Services Examination (ESE) Mains format.</li>
                <li><strong>Syllabus Focus:</strong> Electronic Devices, Analog Circuits, Digital Circuits, Control Systems, Signals &amp; Systems, Electromagnetics, and Microprocessors.</li>
                <li><strong>Preparation Strategy:</strong> Practice solving conventional ESE previous year questions. Focus on deriving formulas, drawing neat circuit diagrams, and step-by-step problem-solving.</li>
              </ul>
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-bold text-slate-900 mb-1">Stage 3: Personal Interview</h3>
              <p className="text-xs sm:text-sm text-slate-700">
                Candidates who clear the written exam are called for an interview in a 1:5 ratio. The DRDO interview is famously rigorous and purely technical.
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2 text-xs sm:text-sm text-slate-700">
                <li><strong>Duration:</strong> Typically 30 to 45 minutes with a panel of 5-6 senior scientists.</li>
                <li><strong>Whiteboard Testing:</strong> You will almost certainly be asked to walk to a whiteboard and draw/explain circuits (e.g., Op-Amp internal architecture, PLL block diagrams, antenna radiation patterns).</li>
                <li><strong>Core Subjects:</strong> They will ask you to name your 3-4 favorite subjects and drill deep into fundamentals. If you say &quot;Analog Circuits&quot;, expect questions starting from basic PN junction physics up to complex amplifier frequency responses.</li>
              </ul>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">3. Final Merit List</h2>
          <p className="text-slate-700">
            The final selection is based on 80% weightage of the Written Examination marks and 20% weightage of the Personal Interview marks.
          </p>
          <p className="mt-3 text-xs text-slate-500 font-semibold">
            <em>Citation: <a href="https://rac.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">DRDO RAC Official Website <ExternalLink className="inline w-3 h-3" /></a></em>
          </p>
        </div>

        <div className="pt-6 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-900">How can an electronics engineer join DRDO?</h3>
              <p className="text-xs text-slate-700 mt-1">Electronics Engineers typically join DRDO as Scientist &apos;B&apos; through the Recruitment and Assessment Centre (RAC). The process involves shortlisting via a valid GATE score in ECE, followed by a written descriptive exam, and finally a rigorous technical interview.</p>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-900">Is GATE mandatory for DRDO Scientist B recruitment?</h3>
              <p className="text-xs text-slate-700 mt-1">Yes, a valid GATE score is usually mandatory for shortlisting candidates for the written exam. However, candidates with an 8.0+ CGPA from IITs or NITs are sometimes exempted from the GATE requirement and called directly for the written test.</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
