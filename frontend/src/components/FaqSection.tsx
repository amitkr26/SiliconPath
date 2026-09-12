"use client";

import { useState, useCallback, useRef } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: "Ingestion & Verification",
    question: "How are JRF, PhD, and industry opportunities sourced and validated?",
    answer: "Every single listing ingested by BerojgarDegreeWala passes through automated scraper checks followed by link validation. We surface listings from official university domain portals (e.g. iitb.ac.in, iisc.ac.in, drdo.gov.in, isro.gov.in) and verified corporate career nodes (e.g. intel.com, qualcomm.com). Always confirm details on the original circular before applying.",
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
    category: "Alerts & Notifications",
    question: "How do I receive instant alerts for new openings matching my exact profile?",
    answer: "You can subscribe to our free Email & Telegram notification system. Specify your target keywords (e.g. 'SystemVerilog', 'IIT Bombay', 'DRDO') and categories ('JRF', 'PhD', 'Private Sector') to receive automated real-time alerts when matching listings are detected by our scrapers.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      const count = FAQS.length;
      let nextIdx: number | null = null;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          nextIdx = (idx + 1) % count;
          break;
        case "ArrowUp":
          e.preventDefault();
          nextIdx = (idx - 1 + count) % count;
          break;
        case "Home":
          e.preventDefault();
          nextIdx = 0;
          break;
        case "End":
          e.preventDefault();
          nextIdx = count - 1;
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          setOpenIndex(openIndex === idx ? null : idx);
          return;
      }

      if (nextIdx !== null) {
        setOpenIndex(nextIdx);
        buttonRefs.current[nextIdx]?.focus();
      }
    },
    [openIndex],
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 lg:p-10 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
        <HelpCircle className="w-4 h-4" />
        <span>Got Questions? We Have Answers</span>
      </div>
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
        Frequently Asked Questions
      </h2>
      <p className="text-slate-600 text-sm mt-1 mb-6 sm:mb-8 font-normal">
        Everything you need to know about JRF fellowships, PhD admissions, and semiconductor careers.
      </p>

      <div className="space-y-3" role="list">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          const panelId = `faq-panel-${idx}`;
          const buttonId = `faq-button-${idx}`;
          return (
            <div
              key={idx}
              className="border border-slate-200 rounded-lg overflow-hidden transition-all bg-white"
              role="listitem"
            >
              <h3>
                <button
                  id={buttonId}
                  ref={(el) => { buttonRefs.current[idx] = el; }}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="w-full p-4 lg:p-5 text-left font-semibold text-sm sm:text-base flex items-center justify-between gap-3 sm:gap-4 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                      {faq.category}
                    </span>
                    <span className="text-slate-900 truncate">{faq.question}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform text-slate-500 ${isOpen ? "rotate-180 text-blue-600" : ""}`} />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
              >
                {isOpen && (
                  <div className="p-4 lg:p-5 bg-slate-50/60 border-t border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed font-normal">
                    {faq.answer}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
