import { cn } from "@/lib/utils";

type CardTone = "default" | "flat" | "inverse" | "accent";

const toneClasses: Record<CardTone, string> = {
  default: "bg-white border-2 border-slate-900 shadow-brutal",
  flat: "bg-white border border-slate-200 shadow-none",
  inverse: "bg-slate-900 border-2 border-slate-900 text-white shadow-brutal",
  accent: "bg-blue-600 border-2 border-slate-900 text-white shadow-brutal",
};

export interface CardProps {
  tone?: CardTone;
  hover?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Card({ tone = "default", hover = false, className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        toneClasses[tone],
        hover && "transition-all hover:-translate-y-1 hover:shadow-brutal-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}