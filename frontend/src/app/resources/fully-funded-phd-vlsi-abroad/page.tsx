import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink, Globe, Landmark, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "How to Get a Fully-Funded PhD in VLSI & Semiconductors Abroad",
  description: "Complete guide for Indian students to secure fully-funded PhD programs in VLSI, Microelectronics, and Semiconductors in Europe, USA, and Asia (DAAD, SINGA, MEXT).",
  alternates: { canonical: "https://berojgardegreewala.vercel.app/resources/fully-funded-phd-vlsi-abroad" },
};

export default function FullyFundedPhdAbroadGuide() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Which countries offer the best fully-funded PhDs in VLSI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Top destinations for fully-funded VLSI PhDs include Germany (TU Munich, TU Dresden), Netherlands (TU Delft), Belgium (KU Leuven / imec), Singapore (NTU, NUS), and the USA. These programs often treat PhD students as salaried employees."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need a Master's degree to apply for a PhD abroad?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "In Europe, a Master's degree (MTech/MS) is almost strictly required. In the US and Singapore, you can often apply directly after a 4-year BTech/BE degree, provided you have excellent academic records and research experience."
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
          <Badge tone="success">International Research</Badge>
          <Badge tone="neutral">Fully-Funded PhD</Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">
          How to Get a Fully-Funded PhD in VLSI &amp; Semiconductors Abroad
        </h1>
        <div className="flex items-center gap-4 mt-3 text-slate-500 text-xs font-bold">
          <span>Updated: July 2026</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> 7 min read</span>
        </div>
      </div>

      <div className="space-y-8 text-slate-800 text-sm leading-relaxed font-medium">
        <div className="bg-emerald-50 border-2 border-slate-900 rounded-xl p-5 shadow-brutal-sm">
          <p className="text-base text-slate-900 font-bold">
            <strong>The secret to a fully-funded PhD:</strong> In many top global semiconductor hubs (like Europe and Singapore), a PhD is not considered &quot;studying&quot; — it is a full-time research job with a competitive salary, full benefits, and zero tuition fees. Here is exactly how to find and secure these positions.
          </p>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-4">1. Top Regions for VLSI &amp; Semiconductor PhDs</h2>
          
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-base font-black text-slate-900 mb-2">Europe (The &quot;Employee&quot; Model)</h3>
              <p className="text-xs sm:text-sm text-slate-700 mb-3">
                In countries like the Netherlands, Germany, and Belgium, PhD candidates are hired as university employees. You receive a monthly salary (typically €2,300 - €3,000 before tax).
              </p>
              <ul className="space-y-2 list-none text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2"><Landmark className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span><strong>Top Institutions:</strong> TU Delft (Netherlands), KU Leuven &amp; imec (Belgium), TU Munich, TU Dresden (Germany), EPFL (Switzerland).</span></li>
                <li className="flex items-start gap-2"><GraduationCap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span><strong>Requirements:</strong> MTech/MSc is strictly required. No GRE needed. IELTS/TOEFL is required.</span></li>
                <li className="flex items-start gap-2"><Globe className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span><strong>How to Apply:</strong> You apply directly to &quot;Vacancies&quot; on the university website, just like a corporate job.</span></li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="text-base font-black text-slate-900 mb-2">Singapore (SINGA Fellowship)</h3>
              <p className="text-xs sm:text-sm text-slate-700 mb-3">
                Singapore is a global semiconductor manufacturing hub. The Singapore International Graduate Award (SINGA) offers fully-funded PhDs at NTU, NUS, and A*STAR.
              </p>
              <ul className="space-y-2 list-none text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2"><Landmark className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span><strong>Stipend:</strong> SGD 2,200/month (increasing to SGD 2,700 after qualifying exam).</span></li>
                <li className="flex items-start gap-2"><GraduationCap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span><strong>Requirements:</strong> BTech or MTech. Excellent academic record.</span></li>
                <li className="flex items-start gap-2"><Globe className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span><strong>How to Apply:</strong> Apply via the centralized SINGA portal. <em><a href="https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa" target="_blank" rel="noopener noreferrer" className="text-accent font-bold hover:underline">Official SINGA Portal <ExternalLink className="inline w-3 h-3" /></a></em></span></li>
              </ul>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-3">2. Step-by-Step Application Strategy</h2>
          
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-base font-black text-slate-900 mb-2">Step 1: The &quot;Cold Email&quot; to Professors</h3>
              <p className="text-xs sm:text-sm text-slate-700 mb-3">
                For US universities and many European labs, securing funding requires a professor to sponsor you. You must write a highly targeted email:
              </p>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs leading-relaxed border-2 border-slate-900">
                Subject: Prospective PhD Student — Fall 2027 — [Your Area, e.g., Analog IC Design]<br/><br/>
                Dear Prof. [Name],<br/><br/>
                I recently read your paper on [Specific Paper Topic] presented at ISSCC. I am very interested in your approach to [Specific Technical Detail].<br/><br/>
                I have been working on [Your relevant project/thesis] where I achieved [Result]. I believe my background in [Skill, e.g., Cadence Virtuoso, FinFET modeling] aligns well with your lab&apos;s current focus.<br/><br/>
                Are you accepting new funded PhD students for Fall 2027? I have attached my CV and transcript for your review.<br/><br/>
                Best regards,<br/>
                [Your Name]
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-base font-black text-slate-900 mb-2">Step 2: Securing External Fellowships</h3>
              <p className="text-xs sm:text-sm text-slate-700 mb-3">If the professor lacks funding, you can secure your own through international fellowships:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                <li><strong>DAAD (Germany):</strong> Funds Indian students for doctoral studies in Germany. Applications usually close in October.</li>
                <li><strong>MEXT (Japan):</strong> Covers tuition and provides ¥143,000/month. Embassy recommendation route opens in April/May.</li>
                <li><strong>Marie Skłodowska-Curie Actions (MSCA):</strong> Highly prestigious EU-funded PhD positions with salaries often exceeding €3,000/month.</li>
              </ul>
            </Card>
          </div>
        </div>

        <div className="pt-6 border-t-2 border-slate-200">
          <h2 className="text-xl font-black text-slate-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-black text-slate-900">Which countries offer the best fully-funded PhDs in VLSI?</h3>
              <p className="text-xs text-slate-700 mt-1">Top destinations for fully-funded VLSI PhDs include Germany (TU Munich, TU Dresden), Netherlands (TU Delft), Belgium (KU Leuven / imec), Singapore (NTU, NUS), and the USA. These programs often treat PhD students as salaried employees.</p>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-black text-slate-900">Do I need a Master&apos;s degree to apply for a PhD abroad?</h3>
              <p className="text-xs text-slate-700 mt-1">In Europe, a Master&apos;s degree (MTech/MS) is almost strictly required. In the US and Singapore, you can often apply directly after a 4-year BTech/BE degree, provided you have excellent academic records and research experience.</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
