import React from "react";
import { ResumeData, ResumeStyleConfig } from "../types";
import { Mail, Phone, MapPin, Linkedin, Github } from "lucide-react";

export function ModernSidebar({
  data,
  style,
}: {
  data: ResumeData;
  style: ResumeStyleConfig;
}) {
  const { accentColor, visibleSections } = style;

  return (
    <div className="w-full h-full flex min-h-[950px] bg-white text-slate-900 text-xs font-sans">
      {/* Left Sidebar (32%) */}
      <aside className="w-1/3 bg-slate-100/80 border-r border-slate-200/90 p-6 flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {data.fullName || "Candidate Name"}
          </h1>
          <p className="text-[11px] font-bold mt-1 uppercase tracking-wider" style={{ color: accentColor }}>
            {data.headline || "VLSI & FPGA Engineer"}
          </p>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 text-[11px] text-slate-600 border-t border-slate-200 pt-3">
          <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Contact</p>
          {data.email && (
            <div className="flex items-center gap-1.5 break-all">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{data.email}</span>
            </div>
          )}
          {data.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{data.phone}</span>
            </div>
          )}
          {data.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{data.location}</span>
            </div>
          )}
          {data.linkedin && (
            <div className="flex items-center gap-1.5 break-all">
              <Linkedin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{data.linkedin}</span>
            </div>
          )}
          {data.github && (
            <div className="flex items-center gap-1.5 break-all">
              <Github className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{data.github}</span>
            </div>
          )}
        </div>

        {/* Technical Skills */}
        {visibleSections.skills && data.skills?.length > 0 && (
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Core Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-white text-slate-800 rounded border border-slate-300 text-[10px] font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {visibleSections.certifications && data.certifications?.length > 0 && (
          <div className="border-t border-slate-200 pt-3 space-y-1.5">
            <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Certifications</p>
            {data.certifications.map((c, i) => (
              <p key={i} className="text-[11px] text-slate-700 font-medium">
                • {c.name} {c.year ? `(${c.year})` : ""}
              </p>
            ))}
          </div>
        )}
      </aside>

      {/* Right Main Content (68%) */}
      <main className="w-2/3 p-6 sm:p-8 flex flex-col gap-5">
        {/* Summary */}
        {visibleSections.summary && data.summary && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2 border-b border-slate-200" style={{ color: accentColor }}>
              About Me
            </h2>
            <p className="text-xs leading-relaxed text-slate-700">{data.summary}</p>
          </section>
        )}

        {/* Experience */}
        {visibleSections.experience && data.experience?.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-3 border-b border-slate-200" style={{ color: accentColor }}>
              Work Experience
            </h2>
            <div className="space-y-3.5">
              {data.experience.map((exp, i) => (
                <div key={i} className="break-inside-avoid">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{exp.role}</span>
                    <span className="text-slate-500 font-normal text-[11px]">{exp.period}</span>
                  </div>
                  <p className="text-slate-600 font-semibold text-[11px]">{exp.org}</p>
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
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-3 border-b border-slate-200" style={{ color: accentColor }}>
              Key Projects
            </h2>
            <div className="space-y-2.5">
              {data.projects.map((proj, i) => (
                <div key={i} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span>{proj.name}</span>
                    {proj.technologies && (
                      <span className="text-[10px] text-slate-500 font-mono font-normal">
                        {proj.technologies}
                      </span>
                    )}
                  </div>
                  {proj.detail && (
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{proj.detail}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {visibleSections.education && data.education?.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2.5 border-b border-slate-200" style={{ color: accentColor }}>
              Education
            </h2>
            <div className="space-y-2">
              {data.education.map((edu, i) => (
                <div key={i} className="flex justify-between items-baseline break-inside-avoid">
                  <div>
                    <p className="font-bold text-slate-900">{edu.degree} {edu.field ? `in ${edu.field}` : ""}</p>
                    <p className="text-slate-600 text-[11px]">{edu.school}</p>
                  </div>
                  <div className="text-right text-slate-500 text-[11px]">
                    <p>{edu.year}</p>
                    {edu.cgpa && <p className="font-bold text-slate-700">CGPA: {edu.cgpa}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
