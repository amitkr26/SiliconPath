import { CheckCircle, XCircle, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ScrapeStatus = "healthy" | "error" | "warning" | "pending";

interface ScrapeHealthCardProps {
  sourceName: string;
  url?: string;
  status: ScrapeStatus;
  lastScrapedAt?: string | null;
  opportunityCount?: number;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<ScrapeStatus, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  healthy:  { icon: CheckCircle,  color: "text-[var(--accent-green)]",  bg: "bg-green-50",   label: "Healthy"  },
  error:    { icon: XCircle,      color: "text-[var(--error)]",          bg: "bg-red-50",     label: "Error"    },
  warning:  { icon: AlertCircle,  color: "text-[var(--accent-amber)]",  bg: "bg-amber-50",   label: "Warning"  },
  pending:  { icon: Clock,        color: "text-[var(--text-tertiary)]",  bg: "bg-gray-50",    label: "Pending"  },
};

export default function ScrapeHealthCard({
  sourceName,
  url,
  status,
  lastScrapedAt,
  opportunityCount,
  errorMessage,
  onRetry,
  className = "",
}: ScrapeHealthCardProps) {
  const { icon: Icon, color, bg, label } = STATUS_CONFIG[status];

  return (
    <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm text-[var(--text)] truncate">{sourceName}</p>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)] truncate block transition-colors"
            >
              {url}
            </a>
          )}
        </div>

        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${bg} ${color}`}>
          <Icon size={11} />
          {label}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
        {lastScrapedAt && (
          <span>Last scraped {formatDistanceToNow(new Date(lastScrapedAt), { addSuffix: true })}</span>
        )}
        {opportunityCount != null && (
          <span className="font-medium text-[var(--text)]">{opportunityCount} opportunities</span>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <p className="text-xs text-[var(--error)] bg-red-50 rounded-lg px-2.5 py-1.5 line-clamp-2">
          {errorMessage}
        </p>
      )}

      {/* Retry */}
      {onRetry && status === "error" && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline font-medium mt-1"
        >
          <RefreshCw size={12} />
          Retry scrape
        </button>
      )}
    </div>
  );
}
