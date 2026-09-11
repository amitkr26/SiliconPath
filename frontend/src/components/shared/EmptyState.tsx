import { AlertCircle } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-16 px-6 text-center ${className}`}
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-500">
        {icon ?? <AlertCircle size={28} />}
      </div>
      <div className="space-y-1.5">
        <h3 className="font-bold text-slate-900 text-base">{title}</h3>
        {description && (
          <p className="text-sm text-slate-600 font-medium max-w-xs mx-auto">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}