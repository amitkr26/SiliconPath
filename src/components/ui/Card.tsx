import { cn } from "@/lib/utils";

type CardTone = "default" | "flat" | "muted" | "inverse" | "accent";
type CardPadding = "none" | "sm" | "md" | "lg";

const toneClasses: Record<CardTone, string> = {
  default: "bg-white border border-slate-200/90 shadow-sm",
  flat: "bg-white border border-slate-200 shadow-none",
  muted: "bg-slate-50/80 border border-slate-200/80 shadow-none",
  inverse: "bg-slate-900 border border-slate-800 text-white shadow-sm",
  accent: "bg-blue-50/40 border border-blue-200/80 text-slate-900 shadow-none",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3 sm:p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
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
        "rounded-xl transition-all duration-150",
        toneClasses[tone],
        paddingClasses[padding],
        hover && "hover:border-slate-300 hover:shadow-md",
        interactive && "cursor-pointer hover:border-blue-300 hover:shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}
