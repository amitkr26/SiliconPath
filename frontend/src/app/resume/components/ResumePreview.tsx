import React, { forwardRef } from "react";
import { ResumeData, ResumeStyleConfig, TemplateId } from "../types";
import { ModernProfessional } from "../templates/ModernProfessional";
import { Minimalist } from "../templates/Minimalist";
import { ClassicCorporate } from "../templates/ClassicCorporate";
import { CompactTechnical } from "../templates/CompactTechnical";
import { AcademicResearch } from "../templates/AcademicResearch";
import { ModernSidebar } from "../templates/ModernSidebar";
import { TwoColumnGrid } from "../templates/TwoColumnGrid";
import { Executive } from "../templates/Executive";
import { FresherCampus } from "../templates/FresherCampus";
import { SiliconTech } from "../templates/SiliconTech";

interface ResumePreviewProps {
  data: ResumeData;
  style: ResumeStyleConfig;
  scale?: number;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ data, style, scale = 1.0 }, ref) => {
    const renderTemplate = () => {
      switch (style.templateId as TemplateId) {
        case "minimalist":
          return <Minimalist data={data} style={style} />;
        case "classic-corporate":
          return <ClassicCorporate data={data} style={style} />;
        case "compact-technical":
          return <CompactTechnical data={data} style={style} />;
        case "academic-research":
          return <AcademicResearch data={data} style={style} />;
        case "modern-sidebar":
          return <ModernSidebar data={data} style={style} />;
        case "two-column":
          return <TwoColumnGrid data={data} style={style} />;
        case "executive":
          return <Executive data={data} style={style} />;
        case "fresher-campus":
          return <FresherCampus data={data} style={style} />;
        case "silicon-tech":
          return <SiliconTech data={data} style={style} />;
        case "modern-professional":
        default:
          return <ModernProfessional data={data} style={style} />;
      }
    };

    return (
      <div className="w-full flex justify-center overflow-x-auto p-2 print:p-0 print:overflow-visible">
        {/* A4 Canvas Container */}
        <div
          ref={ref}
          id="printable-resume-surface"
          style={{
            transform: scale !== 1.0 ? `scale(${scale})` : undefined,
            transformOrigin: "top center",
          }}
          className={`w-full max-w-[800px] min-h-[1130px] bg-white shadow-xl border border-slate-200/90 rounded-none print:shadow-none print:border-none print:max-w-none print:min-h-0 print:w-full print:m-0 ${style.fontFamily} transition-transform duration-150`}
        >
          {renderTemplate()}
        </div>
      </div>
    );
  }
);

ResumePreview.displayName = "ResumePreview";
