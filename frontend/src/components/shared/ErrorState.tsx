import { AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export default function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  action,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-16 px-6 text-center ${className}`}
      role="alert"
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 text-[var(--error)]">
        <AlertTriangle size={28} />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-semibold text-[var(--text)] text-base">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">{message}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
