import { cn } from "@/lib/utils";

type BadgeTone = "accent" | "success" | "warning" | "danger" | "neutral" | "inverse" | "purple";
type BadgeVariant = "default" | "dot";

const toneClasses: Record<BadgeTone, string> = {
  accent: "border-blue-200 text-blue-700 bg-blue-50/80 border",
  success: "border-emerald-200 text-emerald-700 bg-emerald-50/80 border",
  warning: "border-amber-200 text-amber-800 bg-amber-50/80 border",
  danger: "border-red-200 text-red-700 bg-red-50/80 border",
  neutral: "border-slate-200 text-slate-600 bg-slate-100/80 border",
  inverse: "border-slate-800 text-white bg-slate-900 border",
  purple: "border-purple-200 text-purple-700 bg-purple-50/80 border",
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
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-slate-200 text-[11px] font-medium bg-white",
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
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
