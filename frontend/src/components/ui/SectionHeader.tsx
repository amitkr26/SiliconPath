import { cn } from "@/lib/utils";
import { color } from "@/styles/design-tokens";

export interface SectionHeaderProps {
  eyebrow?: string;
  eyebrowTone?: "accent" | "success" | "warning" | "neutral";
  title: string;
  description?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({ eyebrow, eyebrowTone = "accent", title, description, action, align = "left", className }: SectionHeaderProps) {
  const eyebrowBg = eyebrowTone === "accent" ? color.primary : eyebrowTone === "success" ? color.success : eyebrowTone === "warning" ? color.warning : color.neutral;
  const eyebrowFg = eyebrowTone === "accent" ? color.textInverted : eyebrowTone === "success" ? color.textSecondary : eyebrowTone === "warning" ? color.textSecondary : color.textSecondary;

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
          <span
            className={cn(
              "inline-flex items-center px-3 py-1 rounded-lg border-2 border-slate-900 text-xs font-bold uppercase shadow-brutal-sm",
              eyebrowTone === "accent" && "bg-blue-600 text-white",
              eyebrowTone === "success" && "bg-emerald-400 text-slate-900",
              eyebrowTone === "warning" && "bg-amber-400 text-slate-900",
              eyebrowTone === "neutral" && "bg-slate-100 text-slate-700"
            )}
          >
            {eyebrow}
          </span>
        )}
        <h2 className={cn("text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-3")}>{title}</h2>
        {description && <p className={cn("text-sm font-medium text-slate-600 mt-1.5 max-w-2xl")}>{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}