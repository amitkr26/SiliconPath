import { ShieldCheck, ShieldQuestion, ShieldX, Clock } from "lucide-react";

interface VerificationBadgeProps {
  status?: "verified" | "unverified" | "link_unavailable" | "expired" | "pending" | "rejected" | string | null;
  compact?: boolean;
}

export default function VerificationBadge({ status, compact }: VerificationBadgeProps) {
  // Strict check: ONLY genuinely verified opportunities receive the "Official Link Verified" badge
  if (status === "verified") {
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? "text-[10px]" : "text-xs"} text-emerald-700 bg-emerald-100 border border-emerald-400 px-1.5 py-0.5 rounded font-black`}>
        <ShieldCheck className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} text-emerald-700 stroke-[2.5]`} />
        <span>Official Link Verified</span>
      </span>
    );
  }

  if (status === "unverified" || status === "pending" || !status) {
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? "text-[10px]" : "text-xs"} text-slate-500 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded font-semibold`}>
        <Clock className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} text-slate-500`} />
        {compact ? "Pending" : "Pending Verification"}
      </span>
    );
  }

  if (status === "link_unavailable") {
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? "text-[10px]" : "text-xs"} text-blue-700 bg-blue-50 border border-blue-300 px-1.5 py-0.5 rounded font-extrabold`}>
        <ShieldQuestion className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} text-blue-700`} />
        {compact ? "Check Site" : "Check Official Site"}
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? "text-[10px]" : "text-xs"} text-red-700 bg-red-50 border border-red-300 px-1.5 py-0.5 rounded font-medium`}>
        <ShieldX className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} text-red-600`} />
        {compact ? "Rejected" : "Verification Rejected"}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${compact ? "text-[10px]" : "text-xs"} text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-medium`}>
      <ShieldX className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} text-slate-400`} />
      {compact ? "Expired" : "Expired"}
    </span>
  );
}
