import React from "react";
import { ResumeData, ResumeStyleConfig } from "../types";
import { Mail, Phone, MapPin, Globe, Linkedin, Github } from "lucide-react";

export function ModernProfessional({
  data,
  style,
}: {
  data: ResumeData;
  style: ResumeStyleConfig;
}) {
  const { accentColor, visibleSections } = style;

  return (
    <div className="w-full h-full p-8 sm:p-10 text-slate-900 bg-white relative">
      {/* Top Accent Bar */}
      <div
        className="absolute top-0 inset-x-0 h-2.5"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <header className="border-b border-slate-200 pb-5 mb-5">
        <h1
          className="text-2xl sm:text-3xl font-extrabold tracking-tight"
          style={{ color: accentColor }}
        >
          {data.fullName || "Candidate Name"}
        </h1>
        <p className="text-sm font-semibold text-slate-600 mt-1 uppercase tracking-wider">
          {data.headline || "Semiconductor & VLSI Engineer"}
        </p>

        {/* Contact info row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100">
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

      {/* Summary */}
      {visibleSections.summary && data.summary && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2 border-b border-slate-200"
            style={{ color: accentColor }}
          >
            Professional Summary
          </h2>
          <p className="text-xs leading-relaxed text-slate-700">{data.summary}</p>
        </section>
      )}

      {/* Experience */}
      {visibleSections.experience && data.experience?.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-3 border-b border-slate-200"
            style={{ color: accentColor }}
          >
            Professional Experience
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp, i) => (
              <div key={i} className="text-xs break-inside-avoid">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{exp.role || "Role"} • <span className="font-semibold text-slate-700">{exp.org}</span></span>
                  <span className="text-[11px] font-normal text-slate-500">{exp.period}</span>
                </div>
                {exp.detail && (
                  <p className="text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
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
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-3 border-b border-slate-200"
            style={{ color: accentColor }}
          >
            Key Projects
          </h2>
          <div className="space-y-3">
            {data.projects.map((proj, i) => (
              <div key={i} className="text-xs break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{proj.name}</span>
                  {proj.technologies && (
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                      {proj.technologies}
                    </span>
                  )}
                </div>
                {proj.detail && (
                  <p className="text-slate-600 mt-1 leading-relaxed">{proj.detail}</p>
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
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-3 border-b border-slate-200"
            style={{ color: accentColor }}
          >
            Education &amp; Qualifications
          </h2>
          <div className="space-y-2.5">
            {data.education.map((edu, i) => (
              <div key={i} className="text-xs flex justify-between items-baseline break-inside-avoid">
                <div>
                  <p className="font-bold text-slate-900">
                    {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                  </p>
                  <p className="text-slate-600 text-[11px]">{edu.school}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[11px]">{edu.year}</span>
                  {edu.cgpa && (
                    <p className="text-slate-700 font-semibold text-[10px]">CGPA: {edu.cgpa}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {visibleSections.skills && data.skills?.length > 0 && (
        <section className="mb-4">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2.5 border-b border-slate-200"
            style={{ color: accentColor }}
          >
            Technical Skills &amp; EDA Tools
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((skill, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-slate-100 text-slate-800 text-[10.5px] font-semibold rounded-md border border-slate-200/80"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Certifications & Publications */}
      {visibleSections.certifications && data.certifications?.length > 0 && (
        <section className="mb-4">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2 border-b border-slate-200"
            style={{ color: accentColor }}
          >
            Certifications
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700">
            {data.certifications.map((c, i) => (
              <span key={i}>• {c.name} {c.year ? `(${c.year})` : ""}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
