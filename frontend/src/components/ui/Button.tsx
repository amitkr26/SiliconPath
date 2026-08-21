import Link from "next/link";
import { cn } from "@/lib/utils";
import { radius, shadow, color, typography } from "@/styles/design-tokens";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "text-white bg-blue-600 border-2 border-slate-900 shadow-brutal hover:bg-blue-700 hover:shadow-brutal-lg hover:-translate-y-0.5",
  secondary: "text-slate-900 bg-white border-2 border-slate-900 shadow-brutal hover:bg-slate-50 hover:text-blue-600 hover:shadow-brutal-lg hover:-translate-y-0.5",
  ghost: "text-slate-700 border-2 border-transparent hover:bg-slate-100 hover:text-slate-900",
  danger: "text-white bg-red-600 border-2 border-slate-900 shadow-brutal hover:bg-red-700 hover:shadow-brutal-lg hover:-translate-y-0.5",
  success: "text-slate-900 bg-emerald-400 border-2 border-slate-900 shadow-brutal hover:bg-emerald-300 hover:shadow-brutal-lg hover:-translate-y-0.5",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2",
  md: "px-5 py-2.5",
  lg: "px-7 py-3.5",
};

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function Button({ variant = "primary", size = "md", href, className, children, type = "button", onClick, disabled, ariaLabel }: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-pill uppercase tracking-wider transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none",
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