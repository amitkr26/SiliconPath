import React from "react";
import { ResumeData, ResumeStyleConfig } from "../types";

export function CompactTechnical({
  data,
  style,
}: {
  data: ResumeData;
  style: ResumeStyleConfig;
}) {
  const { accentColor, visibleSections } = style;

  return (
    <div className="w-full h-full p-6 sm:p-8 text-slate-900 bg-white text-xs leading-snug">
      {/* Header */}
      <header className="border-b-2 pb-3 mb-3 flex justify-between items-end" style={{ borderColor: accentColor }}>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: accentColor }}>
            {data.fullName || "Candidate Name"}
          </h1>
          <p className="text-xs font-bold text-slate-700 font-mono mt-0.5">
            {data.headline || "ASIC / RTL Design & Verification Engineer"}
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-600 font-mono space-y-0.5">
          <div>{data.email} | {data.phone}</div>
          <div>{data.location} | {data.linkedin || data.github}</div>
        </div>
      </header>

      {/* Skills Matrix (Top prominence for technical screening) */}
      {visibleSections.skills && data.skills?.length > 0 && (
        <section className="mb-3.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <h2 className="text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: accentColor }}>
            Technical Skill Matrix
          </h2>
          <div className="flex flex-wrap gap-1">
            {data.skills.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-white border border-slate-300 text-slate-800 text-[10px] font-mono font-bold rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Summary */}
      {visibleSections.summary && data.summary && (
        <section className="mb-3">
          <p className="text-[11px] leading-relaxed text-slate-700">{data.summary}</p>
        </section>
      )}

      {/* Experience */}
      {visibleSections.experience && data.experience?.length > 0 && (
        <section className="mb-3.5">
          <h2 className="text-[11px] font-black uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-2" style={{ color: accentColor }}>
            Engineering Experience
          </h2>
          <div className="space-y-2.5">
            {data.experience.map((exp, i) => (
              <div key={i} className="break-inside-avoid">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{exp.role} @ <span className="text-slate-700 font-semibold">{exp.org}</span></span>
                  <span className="font-mono text-[10px] text-slate-500 font-normal">{exp.period}</span>
                </div>
                {exp.detail && (
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed whitespace-pre-line pl-1.5">
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
        <section className="mb-3.5">
          <h2 className="text-[11px] font-black uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-2" style={{ color: accentColor }}>
            Silicon &amp; System Projects
          </h2>
          <div className="space-y-2">
            {data.projects.map((proj, i) => (
              <div key={i} className="break-inside-avoid">
                <div className="flex justify-between items-baseline font-bold text-slate-800">
                  <span>{proj.name}</span>
                  {proj.technologies && (
                    <span className="text-[10px] font-mono text-slate-500 font-normal">[{proj.technologies}]</span>
                  )}
                </div>
                {proj.detail && (
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed pl-1.5">{proj.detail}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {visibleSections.education && data.education?.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[11px] font-black uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1.5" style={{ color: accentColor }}>
            Education &amp; Background
          </h2>
          <div className="space-y-1.5">
            {data.education.map((edu, i) => (
              <div key={i} className="flex justify-between items-baseline break-inside-avoid">
                <div>
                  <span className="font-bold text-slate-900">{edu.degree}</span> in {edu.field || "Electronics"} • <span className="text-slate-600">{edu.school}</span>
                </div>
                <div className="text-right font-mono text-[10px] text-slate-500">
                  <span>{edu.year}</span>
                  {edu.cgpa && <span className="ml-1.5 font-bold text-slate-700">CGPA: {edu.cgpa}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
