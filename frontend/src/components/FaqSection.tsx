"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: "Ingestion & Verification",
    question: "How are JRF, PhD, and industry opportunities verified?",
    answer: "Every single listing ingested by BerojgarDegreeWala passes through automated scraper checks followed by human verification. We filter out third-party job aggregators and link directly to official university domain portals (e.g. iitb.ac.in, iisc.ac.in, drdo.gov.in, isro.gov.in) or verified corporate career nodes (e.g. intel.com, qualcomm.com).",
  },
  {
    category: "Research Fellowships",
    question: "Can I apply for DRDO or ISRO JRF positions as a final-year B.Tech / M.Tech student?",
    answer: "Yes! Most Junior Research Fellowship (JRF) positions in DRDO and ISRO accept candidates with a valid GATE score or NET qualification. Final-year students can apply provided they meet degree completion criteria by the document verification date specified in the official circular.",
  },
  {
    category: "Stipend & Benefits",
    question: "What is the standard stipend structure for JRF and SRF positions in India?",
    answer: "As per updated DST/CSIR guidelines, JRF positions receive ₹37,000/month + HRA (ranging from 9% to 27% depending on city tier). Senior Research Fellowships (SRF) receive ₹42,000/month + HRA. Many IIT/IISc JRF roles can also be converted directly into full PhD registrations.",
  },
  {
    category: "VLSI Academy",
    question: "How does the self-paced VLSI Academy curriculum work?",
    answer: "Our VLSI Academy offers structured tracks in Digital Design & Verilog, SystemVerilog & UVM Verification, and Physical Design (RTL-to-GDSII). Every module integrates verified NPTEL lectures, open-source EDA tools (EDA Playground, ChipVerify, OpenLANE), interactive theory, and auto-graded quizzes.",
  },
  {
    category: "Alerts & Notifications",
    question: "How do I receive instant alerts for new openings matching my exact profile?",
    answer: "You can subscribe to our free Email & Telegram notification system. Specify your target keywords (e.g. 'SystemVerilog', 'IIT Bombay', 'DRDO') and categories ('JRF', 'PhD', 'Private Sector') to receive automated real-time alerts the moment matching openings are verified.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-10 shadow-brutal-lg">
      <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-600 mb-2">
        <HelpCircle className="w-4 h-4 stroke-[3]" />
        <span>Got Questions? We Have Answers</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        Frequently Asked Questions
      </h2>
      <p className="text-slate-600 text-sm mt-1 mb-8 font-semibold">
        Everything you need to know about JRF fellowships, PhD admissions, and semiconductor careers.
      </p>

      <div className="space-y-4">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border-2 border-slate-900 rounded-xl overflow-hidden shadow-brutal-sm transition-all bg-white"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className={`w-full p-4 sm:p-5 text-left font-extrabold text-sm sm:text-base flex items-center justify-between gap-4 transition-colors ${
                  isOpen ? "bg-blue-600 text-white" : "bg-white text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
<span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border-2 ${
                  isOpen ? "bg-white text-blue-600 border-white" : "bg-blue-50 text-blue-600 border-blue-200"
                }`}>
                    {faq.category}
                  </span>
                  <span>{faq.question}</span>
                </div>
                <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform stroke-[2.5] ${isOpen ? "rotate-180 text-white" : "text-slate-900"}`} />
              </button>
              {isOpen && (
                <div className="p-4 sm:p-5 bg-blue-50/40 border-t-2 border-slate-900 text-slate-800 text-xs sm:text-sm leading-relaxed font-semibold">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
