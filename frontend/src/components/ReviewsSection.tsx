"use client";

import { ShieldCheck, ExternalLink, CheckCircle2 } from "lucide-react";

const TRUST_SIGNALS = [
  {
    title: "Direct Official Circular Links",
    description: "Every listing links to the source — government portals (.gov.in), IIT/IISc domains, or verified corporate career pages.",
    icon: ExternalLink,
  },
  {
    title: "Automated Link Validation",
    description: "Scrapers fetch new listings daily. Each passes automated link validation — confirming the URL resolves and the source is live before surfacing.",
    icon: CheckCircle2,
  },
  {
    title: "Zero Intermediary Fees",
    description: "BerojgarDegreeWala is a free public aggregator. No paid placement, no sponsored ranking — every listing earns its spot.",
    icon: ShieldCheck,
  },
];

export default function ReviewsSection() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 lg:p-10 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
        <ShieldCheck className="w-4 h-4" />
        <span>How We Build Trust</span>
      </div>
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
        Transparency Over Testimonials
      </h2>
      <p className="text-slate-600 text-sm mt-1 mb-6 sm:mb-8 font-normal">
        We don&apos;t fabricate reviews. Here&apos;s how BerojgarDegreeWala actually works.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {TRUST_SIGNALS.map((signal) => {
          const Icon = signal.icon;
          return (
            <div
              key={signal.title}
              className="bg-slate-50/70 border border-slate-200 rounded-lg p-5 flex flex-col gap-3 hover:border-slate-300 hover:bg-white hover:shadow-xs transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight">
                {signal.title}
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                {signal.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
