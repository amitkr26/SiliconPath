import { cn } from "@/lib/utils";

type BadgeTone = "accent" | "success" | "warning" | "danger" | "neutral" | "purple" | "inverse";

const toneClasses: Record<BadgeTone, string> = {
  accent: "bg-blue-600 text-white border-slate-900",
  success: "bg-emerald-500 text-slate-900 border-slate-900",
  warning: "bg-amber-400 text-slate-900 border-slate-900",
  danger: "bg-red-600 text-white border-slate-900",
  neutral: "bg-white text-slate-700 border-slate-300",
  purple: "bg-purple-600 text-white border-slate-900",
  inverse: "bg-slate-900 text-white border-slate-900",
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
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border-2 text-[10px] font-black uppercase tracking-wider shadow-brutal-sm",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}