import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className={cn("block text-xs font-semibold uppercase tracking-wider text-slate-800")}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full px-3.5 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-brutal-sm focus:outline-none focus:border-blue-600 focus:shadow-brutal transition-all",
          error && "border-red-600 shadow-[2px_2px_0px_0px_#DC2626]",
          className,
        )}
        {...props}
      />
      {error && <p className={cn("text-xs font-semibold text-red-600")}>{error}</p>}
    </div>
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className, id, children, ...props }: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className={cn("block text-xs font-semibold uppercase tracking-wider text-slate-800")}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "w-full px-3.5 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-sm font-medium text-slate-900 shadow-brutal-sm focus:outline-none focus:border-blue-600 focus:shadow-brutal transition-all",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}