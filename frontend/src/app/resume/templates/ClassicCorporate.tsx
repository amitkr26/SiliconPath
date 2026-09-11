import React from "react";
import { ResumeData, ResumeStyleConfig } from "../types";

export function ClassicCorporate({
  data,
  style,
}: {
  data: ResumeData;
  style: ResumeStyleConfig;
}) {
  const { accentColor, visibleSections } = style;

  return (
    <div className="w-full h-full p-10 sm:p-12 text-slate-900 bg-white font-serif">
      {/* Centered Classic Header */}
      <header className="text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-3xl font-bold tracking-normal uppercase text-slate-950">
          {data.fullName || "Candidate Name"}
        </h1>
        {data.headline && (
          <p className="text-xs font-semibold text-slate-700 italic mt-1">
            {data.headline}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-700 mt-2 font-sans">
          {data.location && <span>{data.location}</span>}
          {data.phone && <span>| {data.phone}</span>}
          {data.email && <span>| {data.email}</span>}
          {data.linkedin && <span>| {data.linkedin}</span>}
          {data.github && <span>| {data.github}</span>}
        </div>
      </header>

      {/* Summary */}
      {visibleSections.summary && data.summary && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5 mb-2"
            style={{ color: accentColor }}
          >
            Professional Summary
          </h2>
          <p className="text-xs leading-relaxed text-slate-800 text-justify">{data.summary}</p>
        </section>
      )}

      {/* Experience */}
      {visibleSections.experience && data.experience?.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5 mb-2.5"
            style={{ color: accentColor }}
          >
            Experience
          </h2>
          <div className="space-y-3.5">
            {data.experience.map((exp, i) => (
              <div key={i} className="text-xs break-inside-avoid">
                <div className="flex justify-between font-bold">
                  <span>{exp.org} — <span className="font-normal italic">{exp.role}</span></span>
                  <span className="font-normal text-[11px] font-sans text-slate-700">{exp.period}</span>
                </div>
                {exp.detail && (
                  <p className="text-slate-800 mt-1 leading-relaxed whitespace-pre-line text-justify pl-2">
                    {exp.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {visibleSections.education && data.education?.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5 mb-2.5"
            style={{ color: accentColor }}
          >
            Education
          </h2>
          <div className="space-y-2">
            {data.education.map((edu, i) => (
              <div key={i} className="text-xs flex justify-between break-inside-avoid">
                <div>
                  <span className="font-bold">{edu.school}</span>, {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                </div>
                <div className="text-right font-sans text-[11px] text-slate-700">
                  <span>{edu.year}</span>
                  {edu.cgpa && <span className="ml-2 font-semibold">({edu.cgpa})</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {visibleSections.projects && data.projects?.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5 mb-2.5"
            style={{ color: accentColor }}
          >
            Selected Projects
          </h2>
          <div className="space-y-3">
            {data.projects.map((proj, i) => (
              <div key={i} className="text-xs break-inside-avoid">
                <p className="font-bold">{proj.name} {proj.technologies ? `(${proj.technologies})` : ""}</p>
                {proj.detail && (
                  <p className="text-slate-800 mt-0.5 leading-relaxed pl-2">{proj.detail}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {visibleSections.skills && data.skills?.length > 0 && (
        <section className="mb-4">
          <h2
            className="text-xs font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5 mb-2"
            style={{ color: accentColor }}
          >
            Technical Qualifications
          </h2>
          <p className="text-xs text-slate-800 font-sans leading-relaxed">
            <strong className="font-serif">Areas of Expertise:</strong> {data.skills.join(", ")}
          </p>
        </section>
      )}
    </div>
  );
}
