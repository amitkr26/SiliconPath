import { cn } from "@/lib/utils";

type CardTone = "default" | "flat" | "inverse" | "accent";
type CardPadding = "none" | "sm" | "md" | "lg";

const toneClasses: Record<CardTone, string> = {
  default: "bg-white border border-slate-200 shadow-card",
  flat: "bg-white border border-slate-200 shadow-none",
  inverse: "bg-slate-900 border-2 border-slate-900 text-white shadow-card",
  accent: "bg-blue-600 border-2 border-slate-900 text-white shadow-card",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

export interface CardProps {
  tone?: CardTone;
  padding?: CardPadding;
  hover?: boolean;
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function Card({
  tone = "default",
  padding = "md",
  hover = false,
  interactive = false,
  className,
  children,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-card",
        toneClasses[tone],
        paddingClasses[padding],
        hover && "transition-all hover:-translate-y-1 hover:shadow-elevated",
        interactive && "cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-elevated hover:border-slate-900",
        className,
      )}
    >
      {children}
    </div>
  );
}
