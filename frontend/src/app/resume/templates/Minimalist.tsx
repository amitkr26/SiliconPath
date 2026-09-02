import React from "react";
import { ResumeData, ResumeStyleConfig } from "../types";

export function Minimalist({
  data,
  style,
}: {
  data: ResumeData;
  style: ResumeStyleConfig;
}) {
  const { accentColor, visibleSections } = style;

  return (
    <div className="w-full h-full p-10 sm:p-12 text-slate-800 bg-white">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-light tracking-tight text-slate-900">
          {data.fullName || "Candidate Name"}
        </h1>
        <p
          className="text-xs font-semibold uppercase tracking-widest mt-1"
          style={{ color: accentColor }}
        >
          {data.headline || "Electronics & VLSI Engineer"}
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-3 font-light">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>• {data.phone}</span>}
          {data.location && <span>• {data.location}</span>}
          {data.linkedin && <span>• {data.linkedin}</span>}
          {data.github && <span>• {data.github}</span>}
        </div>
      </header>

      {/* Summary */}
      {visibleSections.summary && data.summary && (
        <section className="mb-6">
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            {data.summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {visibleSections.experience && data.experience?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Experience
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp, i) => (
              <div key={i} className="text-xs break-inside-avoid">
                <div className="flex justify-between font-medium text-slate-900">
                  <span>{exp.role} — <span className="text-slate-600">{exp.org}</span></span>
                  <span className="text-slate-400 text-[11px] font-light">{exp.period}</span>
                </div>
                {exp.detail && (
                  <p className="text-slate-600 mt-1 leading-relaxed font-light whitespace-pre-line">
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
        <section className="mb-6">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Projects
          </h2>
          <div className="space-y-3">
            {data.projects.map((proj, i) => (
              <div key={i} className="text-xs break-inside-avoid">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-900">{proj.name}</span>
                  {proj.technologies && (
                    <span className="text-[10px] text-slate-500 font-mono">{proj.technologies}</span>
                  )}
                </div>
                {proj.detail && (
                  <p className="text-slate-600 mt-1 leading-relaxed font-light">{proj.detail}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {visibleSections.education && data.education?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Education
          </h2>
          <div className="space-y-2">
            {data.education.map((edu, i) => (
              <div key={i} className="text-xs flex justify-between font-light break-inside-avoid">
                <div>
                  <span className="font-medium text-slate-900">{edu.degree}</span>, {edu.school}
                </div>
                <span className="text-slate-400 text-[11px]">{edu.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {visibleSections.skills && data.skills?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Skills
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed font-light">
            {data.skills.join(" • ")}
          </p>
        </section>
      )}
    </div>
  );
}
