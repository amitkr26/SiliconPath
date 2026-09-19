import { cn } from "@/lib/utils";

type BadgeTone = "accent" | "success" | "warning" | "danger" | "neutral" | "inverse" | "purple";
type BadgeVariant = "default" | "dot";

const toneClasses: Record<BadgeTone, string> = {
  accent: "border-blue-200 text-blue-700 bg-blue-50/70",
  success: "border-emerald-200 text-emerald-700 bg-emerald-50/70",
  warning: "border-amber-200 text-amber-800 bg-amber-50/80",
  danger: "border-red-200 text-red-700 bg-red-50/70",
  neutral: "border-slate-200 text-slate-600 bg-slate-100/80",
  inverse: "border-slate-800 text-white bg-slate-900",
  purple: "border-purple-200 text-purple-700 bg-purple-50/70",
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
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium bg-white border-slate-200 text-slate-700",
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
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium tracking-tight",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
