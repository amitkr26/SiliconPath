import React from "react";
import { ResumeData, ResumeStyleConfig } from "../types";
import { Mail, Phone, MapPin, Linkedin, Github } from "lucide-react";

export function FresherCampus({
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
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {data.fullName || "Candidate Name"}
        </h1>
        <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">
          {data.headline || "B.Tech Electronics & Communication | Aspiring VLSI Engineer"}
        </p>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-slate-600 mt-2 text-[11px]">
          {data.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" /> {data.email}
            </span>
          )}
          {data.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" /> {data.phone}
            </span>
          )}
          {data.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" /> {data.location}
            </span>
          )}
          {data.linkedin && (
            <span className="flex items-center gap-1">
              <Linkedin className="w-3 h-3 text-slate-400" /> {data.linkedin}
            </span>
          )}
          {data.github && (
            <span className="flex items-center gap-1">
              <Github className="w-3 h-3 text-slate-400" /> {data.github}
            </span>
          )}
        </div>
      </header>

      {/* Education (Top priority for fresher) */}
      {visibleSections.education && data.education?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2.5 border-b border-slate-200" style={{ color: accentColor }}>
            Academic Qualifications
          </h2>
          <div className="space-y-2.5">
            {data.education.map((edu, i) => (
              <div key={i} className="flex justify-between items-baseline break-inside-avoid">
                <div>
                  <p className="font-bold text-slate-900">{edu.degree} {edu.field ? `in ${edu.field}` : ""}</p>
                  <p className="text-slate-600 text-[11px]">{edu.school}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-[11px]">{edu.year}</p>
                  {edu.cgpa && <p className="font-bold text-slate-800 text-[11px]">Score / CGPA: {edu.cgpa}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Technical Skills */}
      {visibleSections.skills && data.skills?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2.5 border-b border-slate-200" style={{ color: accentColor }}>
            Technical &amp; Hardware Skills
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((skill, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-slate-100 text-slate-800 font-semibold rounded-md text-[10.5px] border border-slate-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Academic & Capstone Projects */}
      {visibleSections.projects && data.projects?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2.5 border-b border-slate-200" style={{ color: accentColor }}>
            Major Technical Projects
          </h2>
          <div className="space-y-3">
            {data.projects.map((proj, i) => (
              <div key={i} className="break-inside-avoid">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{proj.name}</span>
                  {proj.technologies && (
                    <span className="text-[10px] text-slate-500 font-mono font-normal">[{proj.technologies}]</span>
                  )}
                </div>
                {proj.detail && (
                  <p className="text-slate-600 mt-0.5 leading-relaxed pl-1.5">{proj.detail}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Internships / Experience */}
      {visibleSections.experience && data.experience?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2.5 border-b border-slate-200" style={{ color: accentColor }}>
            Internship &amp; Practical Training
          </h2>
          <div className="space-y-3">
            {data.experience.map((exp, i) => (
              <div key={i} className="break-inside-avoid">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{exp.role} • <span className="font-semibold text-slate-700">{exp.org}</span></span>
                  <span className="text-slate-500 text-[11px] font-normal">{exp.period}</span>
                </div>
                {exp.detail && (
                  <p className="text-slate-600 mt-0.5 leading-relaxed whitespace-pre-line pl-1.5">
                    {exp.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Summary / Objective */}
      {visibleSections.summary && data.summary && (
        <section className="mb-4">
          <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-1.5 border-b border-slate-200" style={{ color: accentColor }}>
            Career Objective
          </h2>
          <p className="text-slate-700 leading-relaxed text-xs">{data.summary}</p>
        </section>
      )}
    </div>
  );
}
