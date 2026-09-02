import React from "react";
import { Mail, Phone, MapPin, Linkedin, Github, Globe, ExternalLink } from "lucide-react";
import { ResumeData, ResumeStyleConfig, EduItem, ExpItem, ProjItem, CertItem, PubItem } from "../types";

/** 1. Contact Information Row / Column */
export function ContactBlock({
  data,
  layout = "row",
  iconClass = "w-3 h-3 text-slate-400 shrink-0",
  textClass = "text-xs text-slate-600",
}: {
  data: ResumeData;
  layout?: "row" | "column" | "wrap";
  iconClass?: string;
  textClass?: string;
}) {
  const items = [
    data.email && { icon: Mail, label: data.email, href: `mailto:${data.email}` },
    data.phone && { icon: Phone, label: data.phone, href: `tel:${data.phone}` },
    data.location && { icon: MapPin, label: data.location },
    data.linkedin && { icon: Linkedin, label: data.linkedin, href: data.linkedin.startsWith("http") ? data.linkedin : `https://${data.linkedin}` },
    data.github && { icon: Github, label: data.github, href: data.github.startsWith("http") ? data.github : `https://${data.github}` },
    data.website && { icon: Globe, label: data.website, href: data.website.startsWith("http") ? data.website : `https://${data.website}` },
  ].filter(Boolean) as Array<{ icon: any; label: string; href?: string }>;

  const containerClass =
    layout === "column"
      ? "flex flex-col gap-1.5"
      : layout === "wrap"
      ? "flex flex-wrap gap-x-4 gap-y-1.5"
      : "flex items-center gap-3 flex-wrap";

  return (
    <div className={`${containerClass} ${textClass}`}>
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <span key={idx} className="flex items-center gap-1 break-all">
            <Icon className={iconClass} />
            {item.href ? (
              <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {item.label}
              </a>
            ) : (
              <span>{item.label}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/** 2. Section Heading Primitive */
export function SectionHeading({
  title,
  accentColor,
  styleVariant = "bordered",
}: {
  title: string;
  accentColor: string;
  styleVariant?: "bordered" | "underline" | "minimal" | "filled";
}) {
  if (styleVariant === "filled") {
    return (
      <div className="py-1 px-2.5 rounded mb-2.5 text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accentColor }}>
        {title}
      </div>
    );
  }

  if (styleVariant === "minimal") {
    return (
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
        {title}
      </h2>
    );
  }

  return (
    <h2
      className="text-xs font-bold uppercase tracking-widest pb-1 mb-2.5 border-b border-slate-200"
      style={{ color: accentColor }}
    >
      {title}
    </h2>
  );
}

/** 3. Experience Item Primitive */
export function ExperienceItem({
  item,
  dense = false,
}: {
  item: ExpItem;
  dense?: boolean;
}) {
  return (
    <div className={`break-inside-avoid ${dense ? "space-y-0.5 text-xs" : "space-y-1 text-xs"}`}>
      <div className="flex justify-between items-baseline font-bold text-slate-900">
        <span>
          {item.role || "Role"} {item.org && <span className="font-semibold text-slate-700">• {item.org}</span>}
        </span>
        {item.period && <span className="text-[11px] font-normal text-slate-500 shrink-0 ml-2">{item.period}</span>}
      </div>
      {item.detail && (
        <p className="text-slate-600 leading-relaxed whitespace-pre-line text-xs">
          {item.detail}
        </p>
      )}
    </div>
  );
}

/** 4. Education Item Primitive */
export function EducationItem({
  item,
  dense = false,
}: {
  item: EduItem;
  dense?: boolean;
}) {
  return (
    <div className={`flex justify-between items-baseline break-inside-avoid ${dense ? "text-xs" : "text-xs"}`}>
      <div>
        <p className="font-bold text-slate-900">
          {item.degree} {item.field ? `in ${item.field}` : ""}
        </p>
        <p className="text-slate-600 text-[11px]">{item.school}</p>
      </div>
      <div className="text-right shrink-0 ml-2">
        <span className="text-slate-500 text-[11px]">{item.year}</span>
        {item.cgpa && (
          <p className="text-slate-700 font-semibold text-[10.5px]">CGPA: {item.cgpa}</p>
        )}
      </div>
    </div>
  );
}

/** 5. Project Item Primitive */
export function ProjectItem({
  item,
}: {
  item: ProjItem;
}) {
  return (
    <div className="text-xs break-inside-avoid space-y-0.5">
      <div className="flex justify-between items-baseline">
        <span className="font-bold text-slate-900">{item.name}</span>
        {item.technologies && (
          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium shrink-0 ml-2">
            {item.technologies}
          </span>
        )}
      </div>
      {item.detail && (
        <p className="text-slate-600 leading-relaxed text-xs">{item.detail}</p>
      )}
    </div>
  );
}

/** 6. Skill List Primitive */
export function SkillList({
  skills,
  variant = "badges",
}: {
  skills: string[];
  variant?: "badges" | "inline" | "matrix";
}) {
  if (variant === "inline") {
    return (
      <p className="text-xs text-slate-700 leading-relaxed">
        {skills.join(" • ")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill, i) => (
        <span
          key={i}
          className="px-2.5 py-0.5 bg-slate-100 text-slate-800 text-[10.5px] font-semibold rounded-md border border-slate-200/80"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

/** 7. Publication Item Primitive */
export function PublicationItem({
  item,
}: {
  item: PubItem;
}) {
  return (
    <div className="text-xs break-inside-avoid space-y-0.5">
      <p className="font-semibold text-slate-900">
        &ldquo;{item.title}&rdquo;
        {item.venue && <span className="italic font-normal text-slate-700">, {item.venue}</span>}
        {item.year && <span className="font-normal text-slate-600"> ({item.year})</span>}
      </p>
      {item.doi && (
        <p className="text-[10.5px] font-mono text-blue-600">DOI: {item.doi}</p>
      )}
    </div>
  );
}
