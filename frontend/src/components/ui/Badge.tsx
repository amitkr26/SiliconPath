import { cn } from "@/lib/utils";

type BadgeTone = "accent" | "success" | "warning" | "danger" | "neutral" | "inverse" | "purple";

const toneClasses: Record<BadgeTone, string> = {
  accent: "border-slate-900 text-blue-900 bg-blue-50 shadow-[1px_1px_0px_0px_#0F172A]",
  success: "border-slate-900 text-emerald-900 bg-emerald-50 shadow-[1px_1px_0px_0px_#0F172A]",
  warning: "border-slate-900 text-amber-900 bg-amber-50 shadow-[1px_1px_0px_0px_#0F172A]",
  danger: "border-slate-900 text-red-900 bg-red-50 shadow-[1px_1px_0px_0px_#0F172A]",
  neutral: "border-slate-300 text-slate-700 bg-slate-100 shadow-none",
  inverse: "border-slate-900 text-white bg-slate-900 shadow-[1px_1px_0px_0px_#0F172A]",
  purple: "border-slate-900 text-purple-900 bg-purple-50 shadow-[1px_1px_0px_0px_#0F172A]",
};

export interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ tone = "accent", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill border-2 text-[10px] font-semibold uppercase tracking-wider shadow-card-sm",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}