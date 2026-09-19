import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "text-white bg-blue-600 hover:bg-blue-700 border border-transparent shadow-sm",
  secondary: "text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
  outline: "text-slate-700 bg-transparent border border-slate-300 hover:bg-slate-100 hover:text-slate-900",
  ghost: "text-slate-600 bg-transparent border border-transparent hover:bg-slate-100 hover:text-slate-900",
  danger: "text-white bg-red-600 hover:bg-red-700 border border-transparent shadow-sm",
  success: "text-white bg-emerald-600 hover:bg-emerald-700 border border-transparent shadow-sm",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-xs gap-1.5",
  md: "px-3.5 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm font-semibold gap-2",
  icon: "p-2 aspect-square",
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

export function Button({
  variant = "primary",
  size = "md",
  href,
  className,
  children,
  type = "button",
  onClick,
  disabled,
  ariaLabel,
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none select-none",
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
