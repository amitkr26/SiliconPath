import React from "react";
import { ResumeData, ResumeStyleConfig } from "../types";

export function TwoColumnGrid({
  data,
  style,
}: {
  data: ResumeData;
  style: ResumeStyleConfig;
}) {
  const { accentColor, visibleSections } = style;

  return (
    <div className="w-full h-full p-8 sm:p-10 text-slate-900 bg-white text-xs leading-snug">
      {/* Header */}
      <header className="border-b-2 pb-4 mb-5 flex justify-between items-end" style={{ borderColor: accentColor }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: accentColor }}>
            {data.fullName || "Candidate Name"}
          </h1>
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mt-0.5">
            {data.headline || "Semiconductor & Hardware Engineer"}
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-600 space-y-0.5">
          <div>{data.email} | {data.phone}</div>
          <div>{data.location} | {data.linkedin || data.github}</div>
        </div>
      </header>

      {/* Summary */}
      {visibleSections.summary && data.summary && (
        <section className="mb-4">
          <p className="text-xs leading-relaxed text-slate-700">{data.summary}</p>
        </section>
      )}

      {/* 2-Column Balanced Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Left Column: Experience */}
        <div className="space-y-4">
          {visibleSections.experience && data.experience?.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2.5 border-b border-slate-200" style={{ color: accentColor }}>
                Experience
              </h2>
              <div className="space-y-3">
                {data.experience.map((exp, i) => (
                  <div key={i} className="break-inside-avoid">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{exp.role}</span>
                      <span className="text-[10.5px] font-normal text-slate-500">{exp.period}</span>
                    </div>
                    <p className="text-slate-600 font-semibold text-[11px]">{exp.org}</p>
                    {exp.detail && (
                      <p className="text-slate-600 mt-1 leading-relaxed whitespace-pre-line text-[11px]">
                        {exp.detail}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Projects, Education, Skills */}
        <div className="space-y-4">
          {/* Projects */}
          {visibleSections.projects && data.projects?.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2.5 border-b border-slate-200" style={{ color: accentColor }}>
                Projects
              </h2>
              <div className="space-y-2.5">
                {data.projects.map((proj, i) => (
                  <div key={i} className="break-inside-avoid">
                    <p className="font-bold text-slate-900">{proj.name}</p>
                    {proj.detail && (
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{proj.detail}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {visibleSections.education && data.education?.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2 border-b border-slate-200" style={{ color: accentColor }}>
                Education
              </h2>
              <div className="space-y-1.5">
                {data.education.map((edu, i) => (
                  <div key={i} className="flex justify-between items-baseline break-inside-avoid">
                    <div>
                      <p className="font-bold text-slate-900">{edu.degree}</p>
                      <p className="text-slate-600 text-[11px]">{edu.school}</p>
                    </div>
                    <span className="text-slate-500 text-[11px]">{edu.year}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {visibleSections.skills && data.skills?.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2 border-b border-slate-200" style={{ color: accentColor }}>
                Technical Skills
              </h2>
              <div className="flex flex-wrap gap-1">
                {data.skills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[10.5px] font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
