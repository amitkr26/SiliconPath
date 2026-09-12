import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "text-white bg-blue-600 border border-transparent shadow-sm hover:bg-blue-700 transition-colors",
  secondary: "text-slate-800 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-colors",
  ghost: "text-slate-700 border border-transparent hover:bg-slate-100 hover:text-slate-900 transition-colors",
  danger: "text-white bg-red-600 border border-transparent shadow-sm hover:bg-red-700 transition-colors",
  success: "text-white bg-emerald-600 border border-transparent shadow-sm hover:bg-emerald-700 transition-colors",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
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
    "inline-flex items-center justify-center gap-2 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none font-medium text-center",
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
