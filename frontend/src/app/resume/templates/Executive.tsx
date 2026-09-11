import React from "react";
import { ResumeData, ResumeStyleConfig } from "../types";

export function Executive({
  data,
  style,
}: {
  data: ResumeData;
  style: ResumeStyleConfig;
}) {
  const { accentColor, visibleSections } = style;

  return (
    <div className="w-full h-full bg-white text-slate-900 text-xs leading-relaxed font-sans">
      {/* Dark Executive Banner Header */}
      <header className="bg-slate-900 text-white p-8 sm:p-10">
        <h1 className="text-3xl font-extrabold tracking-tight uppercase">
          {data.fullName || "Candidate Name"}
        </h1>
        <p className="text-sm font-semibold mt-1 tracking-wide" style={{ color: accentColor }}>
          {data.headline || "Principal Silicon Architect | Engineering Leader"}
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300 mt-3 pt-3 border-t border-slate-700">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>• {data.phone}</span>}
          {data.location && <span>• {data.location}</span>}
          {data.linkedin && <span>• {data.linkedin}</span>}
        </div>
      </header>

      <div className="p-8 sm:p-10 space-y-6">
        {/* Executive Profile Summary */}
        {visibleSections.summary && data.summary && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2 border-b-2 border-slate-900">
              Executive Profile &amp; Core Strengths
            </h2>
            <p className="text-slate-700 leading-relaxed text-xs">{data.summary}</p>
          </section>
        )}

        {/* Leadership & Engineering Experience */}
        {visibleSections.experience && data.experience?.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-3 border-b-2 border-slate-900">
              Career Trajectory &amp; Track Record
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp, i) => (
                <div key={i} className="break-inside-avoid">
                  <div className="flex justify-between font-bold text-slate-900 text-xs">
                    <span>{exp.role} — <span className="font-semibold text-slate-700">{exp.org}</span></span>
                    <span className="text-slate-500 font-normal text-[11px]">{exp.period}</span>
                  </div>
                  {exp.detail && (
                    <p className="text-slate-600 mt-1 leading-relaxed whitespace-pre-line text-xs pl-2">
                      {exp.detail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key Strategic Projects */}
        {visibleSections.projects && data.projects?.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-3 border-b-2 border-slate-900">
              Major Programs &amp; Silicon Deliverables
            </h2>
            <div className="space-y-3">
              {data.projects.map((proj, i) => (
                <div key={i} className="break-inside-avoid">
                  <p className="font-bold text-slate-900 text-xs">{proj.name}</p>
                  {proj.detail && (
                    <p className="text-slate-600 mt-0.5 leading-relaxed text-xs pl-2">{proj.detail}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education & Credentials */}
        {visibleSections.education && data.education?.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2.5 border-b-2 border-slate-900">
              Academic Credentials
            </h2>
            <div className="space-y-2">
              {data.education.map((edu, i) => (
                <div key={i} className="flex justify-between items-baseline break-inside-avoid">
                  <div>
                    <span className="font-bold text-slate-900">{edu.degree}</span>, {edu.school}
                  </div>
                  <span className="text-slate-500 text-[11px]">{edu.year}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Core Competencies */}
        {visibleSections.skills && data.skills?.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2 border-b-2 border-slate-900">
              Technical &amp; Domain Competencies
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((s, i) => (
                <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-800 font-semibold rounded text-[11px]">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
