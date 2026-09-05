"use client";

import { ShieldCheck, ExternalLink, CheckCircle2 } from "lucide-react";

const TRUST_SIGNALS = [
  {
    title: "Direct Official Circular Links",
    description: "Every listing links to the source — government portals (.gov.in), IIT/IISc domains, or verified corporate career pages.",
    icon: ExternalLink,
  },
  {
    title: "Automated + Human Verification",
    description: "Scrapers fetch new listings daily. Each passes link validation and availability checks before surfacing in the public feed.",
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
    <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-10 shadow-brutal-lg">
      <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-600 mb-2">
        <ShieldCheck className="w-4 h-4 stroke-[3]" />
        <span>How We Build Trust</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        Transparency Over Testimonials
      </h2>
      <p className="text-slate-600 text-sm mt-1 mb-8 font-semibold">
        We don&apos;t fabricate reviews. Here&apos;s how BerojgarDegreeWala actually works.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TRUST_SIGNALS.map((signal) => {
          const Icon = signal.icon;
          return (
            <div
              key={signal.title}
              className="bg-slate-50 border-2 border-slate-900 rounded-xl p-6 shadow-brutal flex flex-col gap-3 hover:-translate-y-1 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-slate-900 flex items-center justify-center text-blue-600 shadow-brutal-sm">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                {signal.title}
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                {signal.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
