import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  eyebrow?: string;
  eyebrowTone?: "accent" | "success" | "purple" | "neutral";
  title: string;
  description?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

const eyebrowTones = {
  accent: "bg-blue-600 text-white border-slate-900",
  success: "bg-emerald-500 text-slate-900 border-slate-900",
  purple: "bg-purple-600 text-white border-slate-900",
  neutral: "bg-white text-slate-700 border-slate-300",
};

export function SectionHeader({ eyebrow, eyebrowTone = "accent", title, description, action, align = "left", className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8",
        align === "center" && "text-center items-center",
        className,
      )}
    >
      <div className={cn(align === "center" && "mx-auto")}>
        {eyebrow && (
          <span className={cn("inline-flex items-center px-3 py-1 rounded-lg border-2 text-xs font-black uppercase shadow-brutal-sm", eyebrowTones[eyebrowTone])}>
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">{title}</h2>
        {description && <p className="text-sm font-medium text-slate-600 mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}