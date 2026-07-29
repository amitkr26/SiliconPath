"use client";

import { Star, Quote, Award } from "lucide-react";

interface Review {
  id: string;
  name: string;
  role: string;
  organization: string;
  avatarBg: string;
  rating: number;
  comment: string;
  tag: string;
}

const REVIEWS: Review[] = [
  {
    id: "1",
    name: "Rohan Deshmukh",
    role: "Junior Research Fellow (JRF)",
    organization: "IIT Bombay - Microelectronics Dept",
    avatarBg: "bg-blue-600 text-white",
    rating: 5,
    comment: "BerojgarDegreeWala was a lifesaver during my M.Tech final semester. I found direct official application links for 3 JRF positions at IIT Bombay and secured my fellowship with direct PhD conversion!",
    tag: "IIT Bombay JRF",
  },
  {
    id: "2",
    name: "Ananya Sharma",
    role: "RTL Verification Engineer",
    organization: "Intel India (Bengaluru)",
    avatarBg: "bg-purple-600 text-white",
    rating: 5,
    comment: "The VLSI Academy SystemVerilog and UVM modules gave me the exact hands-on coverage and assertion practice needed to crack Intel's technical interview round. Highly recommended!",
    tag: "VLSI Academy Alumni",
  },
  {
    id: "3",
    name: "Karthik Raja",
    role: "Scientist 'B' Aspirant",
    organization: "DRDO LRDE Candidate",
    avatarBg: "bg-emerald-600 text-white",
    rating: 5,
    comment: "The real-time email alerts allowed me to apply to the DRDO Scientist B walk-in circular within hours of publishing. The platform provides 100% genuine official links with zero clickbait.",
    tag: "DRDO Recipient",
  },
];

export default function ReviewsSection() {
  return (
    <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_#0F172A]">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-600 mb-1">
            <Award className="w-4 h-4 stroke-[3]" />
            <span>Community Success Stories</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Trusted by India's Hardware Engineers
          </h2>
          <p className="text-slate-600 text-sm mt-1 font-semibold">
            See how candidates landed JRF positions, PhD admissions, and VLSI industry roles.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border-2 border-slate-900 rounded-xl shadow-[2.5px_2.5px_0px_0px_#0F172A]">
          <div className="flex text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-slate-900 stroke-[1.5]" />
            ))}
          </div>
          <span className="text-xs font-black text-slate-900">4.9/5 Average User Rating</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REVIEWS.map((rev) => (
          <div
            key={rev.id}
            className="bg-slate-50 border-2 border-slate-900 rounded-xl p-6 shadow-[3px_3px_0px_0px_#0F172A] flex flex-col justify-between hover:-translate-y-1 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-slate-900 stroke-[1.5]" />
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-slate-900">
                  {rev.tag}
                </span>
              </div>
              <Quote className="w-6 h-6 text-blue-600 mb-2 opacity-40 stroke-[2.5]" />
              <p className="text-slate-800 text-xs sm:text-sm leading-relaxed font-semibold mb-6">
                "{rev.comment}"
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t-2 border-slate-200">
              <div className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_#0F172A] ${rev.avatarBg}`}>
                {rev.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{rev.name}</h4>
                <p className="text-slate-600 text-[11px] font-semibold">{rev.role}</p>
                <p className="text-blue-600 text-[10px] font-bold">{rev.organization}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
