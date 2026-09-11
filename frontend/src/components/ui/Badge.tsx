import { cn } from "@/lib/utils";

type BadgeTone = "accent" | "success" | "warning" | "danger" | "neutral" | "inverse" | "purple";
type BadgeVariant = "default" | "dot";

const toneClasses: Record<BadgeTone, string> = {
  accent: "border-slate-900 text-blue-900 bg-blue-50 border-2",
  success: "border-slate-900 text-emerald-900 bg-emerald-50 border-2",
  warning: "border-slate-900 text-amber-900 bg-amber-50 border-2",
  danger: "border-slate-900 text-red-900 bg-red-50 border-2",
  neutral: "border-slate-300 text-slate-700 bg-slate-100 border",
  inverse: "border-slate-900 text-white bg-slate-900 border-2",
  purple: "border-slate-900 text-purple-900 bg-purple-50 border-2",
};

const dotColor: Record<BadgeTone, string> = {
  accent: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  neutral: "bg-slate-400",
  inverse: "bg-white",
  purple: "bg-purple-500",
};

export interface BadgeProps {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ tone = "accent", variant = "default", className, children }: BadgeProps) {
  if (variant === "dot") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill border border-slate-200 text-[11px] font-medium bg-white",
          className,
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", dotColor[tone])} />
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-semibold uppercase tracking-wider",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
