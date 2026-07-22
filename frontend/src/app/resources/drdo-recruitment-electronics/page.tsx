import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink, ShieldAlert, Target, FileText, GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "DRDO Recruitment Process for Electronics Engineers: Complete Guide | BerojgarDegreeWala",
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
      
      <Link href="/resources" className="inline-flex items-center gap-1 text-[#94A3B8] hover:text-white transition-colors text-sm mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Resources
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
          DRDO Recruitment Process for Electronics Engineers: Complete Guide
        </h1>
        <div className="flex items-center gap-4 mt-4 text-[#94A3B8] text-sm">
          <span>Updated: July 2026</span>
          <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> 6 min read</span>
        </div>
      </div>

      <div className="prose prose-invert prose-blue max-w-none">
        <p className="text-lg text-[#E2E8F0] font-medium leading-relaxed border-l-4 border-blue-400 pl-4">
          <strong>The Core Pathway:</strong> Joining the Defence Research and Development Organisation (DRDO) as a Scientist &apos;B&apos; requires clearing a three-stage process managed by the Recruitment and Assessment Centre (RAC): GATE Shortlisting → Written Exam → Personal Interview.
        </p>

        <h2 className="text-2xl font-bold text-white mt-10 mb-4">1. Eligibility Criteria (Electronics / ECE)</h2>
        <ul className="space-y-2 mt-4 bg-[#1A2438] p-6 rounded-xl border border-[#1F2937] list-none">
          <li className="flex items-start gap-2"><GraduationCap className="w-5 h-5 text-blue-400 shrink-0" /> <strong>Degree:</strong> First Class Bachelor&apos;s Degree (B.E. / B.Tech) in Electronics &amp; Communication Engg, Electronics Engg, or equivalent from a recognized university.</li>
          <li className="flex items-start gap-2"><Target className="w-5 h-5 text-blue-400 shrink-0" /> <strong>GATE:</strong> Must possess a valid GATE score in Electronics and Communication Engineering (EC).</li>
          <li className="flex items-start gap-2"><ShieldAlert className="w-5 h-5 text-blue-400 shrink-0" /> <strong>Age Limit:</strong> Unreserved (UR): 28 years, OBC (NCL): 31 years, SC/ST: 33 years.</li>
        </ul>
        <p className="mt-4 text-sm text-[#94A3B8]">
          <em>Note: IIT/NIT graduates with a minimum CGPA of 8.0/10 are often eligible to apply without a GATE score.</em>
        </p>

        <h2 className="text-2xl font-bold text-white mt-10 mb-4">2. The 3-Stage Selection Process</h2>
        
        <h3 className="text-xl font-semibold text-[#E2E8F0] mt-6">Stage 1: Shortlisting</h3>
        <p>
          Candidates are shortlisted for the written examination based on their GATE scores. The ratio is typically 1:25 (25 candidates called for the written test for every 1 vacancy).
        </p>

        <h3 className="text-xl font-semibold text-[#E2E8F0] mt-6">Stage 2: Written Examination</h3>
        <p>
          Unlike the objective-type GATE exam, the DRDO RAC written exam is usually a <strong>descriptive (subjective) paper</strong>.
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Format:</strong> Two papers (Paper I and Paper II), similar to the UPSC Engineering Services Examination (ESE) Mains format.</li>
          <li><strong>Syllabus Focus:</strong> Electronic Devices, Analog Circuits, Digital Circuits, Control Systems, Signals & Systems, Electromagnetics, and Microprocessors.</li>
          <li><strong>Preparation Strategy:</strong> Practice solving conventional ESE previous year questions. Focus on deriving formulas, drawing neat circuit diagrams, and step-by-step problem-solving.</li>
        </ul>

        <h3 className="text-xl font-semibold text-[#E2E8F0] mt-6">Stage 3: Personal Interview</h3>
        <p>
          Candidates who clear the written exam are called for an interview in a 1:5 ratio. The DRDO interview is famously rigorous and purely technical.
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Duration:</strong> Typically 30 to 45 minutes with a panel of 5-6 senior scientists.</li>
          <li><strong>Whiteboard Testing:</strong> You will almost certainly be asked to walk to a whiteboard and draw/explain circuits (e.g., Op-Amp internal architecture, PLL block diagrams, antenna radiation patterns).</li>
          <li><strong>Core Subjects:</strong> They will ask you to name your 3-4 favorite subjects and drill deep into fundamentals. If you say &quot;Analog Circuits&quot;, expect questions starting from basic PN junction physics up to complex amplifier frequency responses.</li>
        </ul>

        <h2 className="text-2xl font-bold text-white mt-10 mb-4">3. Final Merit List</h2>
        <p>
          The final selection is based on 80% weightage of the Written Examination marks and 20% weightage of the Personal Interview marks.
        </p>
        <p className="mt-4 text-sm text-[#94A3B8]">
          <em>Citation: <a href="https://rac.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">DRDO RAC Official Website <ExternalLink className="inline w-3 h-3" /></a></em>
        </p>

        <hr className="border-[#1F2937] my-10" />

        <h2 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        
        <h3 className="text-lg font-bold text-[#E2E8F0]">How can an electronics engineer join DRDO?</h3>
        <p>Electronics Engineers typically join DRDO as Scientist &apos;B&apos; through the Recruitment and Assessment Centre (RAC). The process involves shortlisting via a valid GATE score in ECE, followed by a written descriptive exam, and finally a rigorous technical interview.</p>

        <h3 className="text-lg font-bold text-[#E2E8F0] mt-6">Is GATE mandatory for DRDO Scientist B recruitment?</h3>
        <p>Yes, a valid GATE score is usually mandatory for shortlisting candidates for the written exam. However, candidates with an 8.0+ CGPA from IITs or NITs are sometimes exempted from the GATE requirement and called directly for the written test.</p>
      </div>
    </div>
  );
}
