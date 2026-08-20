import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white border-2 border-slate-900 shadow-brutal hover:bg-accent-hover hover:shadow-brutal-lg hover:-translate-y-0.5",
  secondary: "bg-white text-slate-900 border-2 border-slate-900 shadow-brutal hover:bg-blue-50 hover:text-accent hover:shadow-brutal-lg hover:-translate-y-0.5",
  ghost: "bg-transparent text-slate-700 border-2 border-transparent hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-red-600 text-white border-2 border-slate-900 shadow-brutal hover:bg-red-700 hover:shadow-brutal-lg hover:-translate-y-0.5",
  success: "bg-emerald-500 text-slate-900 border-2 border-slate-900 shadow-brutal hover:bg-emerald-600 hover:shadow-brutal-lg hover:-translate-y-0.5",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-sm",
};

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function Button({ variant = "primary", size = "md", href, className, children, type = "button", onClick, disabled, ariaLabel }: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-black uppercase tracking-wide transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  );
}