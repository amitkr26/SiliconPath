import React from "react";
import { ResumeData, ResumeStyleConfig } from "../types";

export function SiliconTech({
  data,
  style,
}: {
  data: ResumeData;
  style: ResumeStyleConfig;
}) {
  const { accentColor, visibleSections } = style;

  return (
    <div className="w-full h-full p-8 sm:p-10 text-slate-900 bg-white font-mono text-xs leading-relaxed">
      {/* Terminal-inspired Header */}
      <header className="border-b-2 border-slate-900 pb-4 mb-5">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>siliconpath/engineers/{data.fullName ? data.fullName.toLowerCase().replace(/\s+/g, "-") : "candidate"}.sv</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-sans">
          {data.fullName || "Candidate Name"}
        </h1>
        <p className="text-xs font-bold text-blue-600 mt-0.5">
          {"//"} {data.headline || "ASIC Design & Verification Specialist"}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 mt-2 text-[11px]">
          {data.email && <span>email: {data.email}</span>}
          {data.phone && <span>| phone: {data.phone}</span>}
          {data.location && <span>| loc: {data.location}</span>}
        </div>
      </header>

      {/* Skills Matrix */}
      {visibleSections.skills && data.skills?.length > 0 && (
        <section className="mb-5 bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-800">
          <h2 className="text-[11px] font-bold text-emerald-400 mb-2">
            $ cat eda_skills_manifest.txt
          </h2>
          <div className="flex flex-wrap gap-1.5 font-sans">
            {data.skills.map((s, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-200 text-[10px] font-mono rounded border border-slate-700">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {visibleSections.experience && data.experience?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-black uppercase text-slate-900 border-b border-slate-300 pb-1 mb-3">
            # Experience Modules
          </h2>
          <div className="space-y-3.5 font-sans">
            {data.experience.map((exp, i) => (
              <div key={i} className="break-inside-avoid">
                <div className="flex justify-between font-bold text-slate-900 text-xs">
                  <span>{exp.role} @ {exp.org}</span>
                  <span className="font-mono text-[10px] text-slate-500 font-normal">{exp.period}</span>
                </div>
                {exp.detail && (
                  <p className="text-slate-600 mt-1 leading-relaxed whitespace-pre-line text-xs pl-2 border-l-2 border-slate-200">
                    {exp.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {visibleSections.projects && data.projects?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-black uppercase text-slate-900 border-b border-slate-300 pb-1 mb-3">
            # Tapeouts &amp; Projects
          </h2>
          <div className="space-y-3 font-sans">
            {data.projects.map((proj, i) => (
              <div key={i} className="break-inside-avoid">
                <div className="flex justify-between items-baseline font-bold text-slate-900 text-xs">
                  <span>{proj.name}</span>
                  {proj.technologies && (
                    <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {proj.technologies}
                    </span>
                  )}
                </div>
                {proj.detail && (
                  <p className="text-slate-600 mt-0.5 leading-relaxed text-xs pl-2 border-l-2 border-slate-200">{proj.detail}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {visibleSections.education && data.education?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-black uppercase text-slate-900 border-b border-slate-300 pb-1 mb-2">
            # Academic Qualifications
          </h2>
          <div className="space-y-1.5 font-sans">
            {data.education.map((edu, i) => (
              <div key={i} className="flex justify-between items-baseline break-inside-avoid text-xs">
                <div>
                  <span className="font-bold">{edu.degree}</span> • {edu.school}
                </div>
                <span className="font-mono text-[10px] text-slate-500">{edu.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
