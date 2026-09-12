import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  eyebrow?: string;
  eyebrowTone?: "accent" | "success" | "warning" | "neutral";
  title: string;
  description?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

const eyebrowColor: Record<string, string> = {
  accent: "text-blue-600",
  success: "text-emerald-600",
  warning: "text-amber-700",
  neutral: "text-slate-500",
};

export function SectionHeader({
  eyebrow,
  eyebrowTone = "accent",
  title,
  description,
  action,
  align = "left",
  className,
}: SectionHeaderProps) {
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
          <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1.5", eyebrowColor[eyebrowTone])}>
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
