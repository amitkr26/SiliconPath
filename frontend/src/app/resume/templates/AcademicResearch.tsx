import React from "react";
import { ResumeData, ResumeStyleConfig } from "../types";

export function AcademicResearch({
  data,
  style,
}: {
  data: ResumeData;
  style: ResumeStyleConfig;
}) {
  const { accentColor, visibleSections } = style;

  return (
    <div className="w-full h-full p-8 sm:p-10 text-slate-900 bg-white text-xs leading-relaxed font-sans">
      {/* Header */}
      <header className="border-b-2 pb-4 mb-5 text-center" style={{ borderColor: accentColor }}>
        <h1 className="text-2xl font-black text-slate-950 uppercase tracking-wide">
          {data.fullName || "Candidate Name"}
        </h1>
        <p className="text-xs font-semibold text-slate-700 mt-1">
          {data.headline || "Junior Research Fellow | Microelectronics & VLSI"}
        </p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-slate-600 mt-2 text-[11px]">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>• {data.phone}</span>}
          {data.location && <span>• {data.location}</span>}
          {data.linkedin && <span>• {data.linkedin}</span>}
        </div>
      </header>

      {/* Research Interests / Summary */}
      {visibleSections.summary && data.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2 border-b border-slate-300" style={{ color: accentColor }}>
            Research Focus &amp; Objective
          </h2>
          <p className="text-slate-800 leading-relaxed">{data.summary}</p>
        </section>
      )}

      {/* Academic Background */}
      {visibleSections.education && data.education?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2.5 border-b border-slate-300" style={{ color: accentColor }}>
            Academic Qualifications
          </h2>
          <div className="space-y-3">
            {data.education.map((edu, i) => (
              <div key={i} className="flex justify-between items-baseline break-inside-avoid">
                <div>
                  <p className="font-bold text-slate-900">{edu.degree} {edu.field ? `in ${edu.field}` : ""}</p>
                  <p className="text-slate-600">{edu.school}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">{edu.year}</p>
                  {edu.cgpa && <p className="font-semibold text-slate-800">CGPA: {edu.cgpa}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Publications */}
      {visibleSections.publications && data.publications?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2.5 border-b border-slate-300" style={{ color: accentColor }}>
            Publications &amp; Conference Proceedings
          </h2>
          <ol className="list-decimal ml-4 space-y-1.5 text-slate-800">
            {data.publications.map((pub, i) => (
              <li key={i} className="break-inside-avoid">
                <span className="font-semibold text-slate-950">&ldquo;{pub.title}&rdquo;</span>
                {pub.venue && <span className="italic">, {pub.venue}</span>}
                {pub.year && <span> ({pub.year})</span>}
                {pub.doi && <span className="font-mono text-[10px] text-blue-600 ml-1">DOI: {pub.doi}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Research & Lab Experience */}
      {visibleSections.experience && data.experience?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2.5 border-b border-slate-300" style={{ color: accentColor }}>
            Research &amp; Project Experience
          </h2>
          <div className="space-y-3.5">
            {data.experience.map((exp, i) => (
              <div key={i} className="break-inside-avoid">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{exp.role} — <span className="font-semibold text-slate-700">{exp.org}</span></span>
                  <span className="text-slate-500 font-normal">{exp.period}</span>
                </div>
                {exp.detail && (
                  <p className="text-slate-700 mt-1 leading-relaxed whitespace-pre-line pl-2">
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
          <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2.5 border-b border-slate-300" style={{ color: accentColor }}>
            Key Technical &amp; Thesis Projects
          </h2>
          <div className="space-y-2.5">
            {data.projects.map((proj, i) => (
              <div key={i} className="break-inside-avoid">
                <p className="font-bold text-slate-900">{proj.name}</p>
                {proj.detail && (
                  <p className="text-slate-700 mt-0.5 leading-relaxed pl-2">{proj.detail}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {visibleSections.skills && data.skills?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2 border-b border-slate-300" style={{ color: accentColor }}>
            Laboratory &amp; EDA Competencies
          </h2>
          <p className="text-slate-800">{data.skills.join(" • ")}</p>
        </section>
      )}
    </div>
  );
}
