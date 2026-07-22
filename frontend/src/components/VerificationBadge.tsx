import { ShieldCheck, ShieldAlert, ShieldQuestion, ShieldX, Clock } from "lucide-react";

interface VerificationBadgeProps {
  status: "verified" | "unverified" | "link_unavailable" | "expired";
  compact?: boolean;
}

export default function VerificationBadge({ status, compact }: VerificationBadgeProps) {
  if (status === "verified") {
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? "text-[10px]" : "text-xs"} text-green-400 font-medium`}>
        <ShieldCheck className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
        {compact ? "" : "Verified"}
      </span>
    );
  }

  if (status === "unverified") {
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? "text-[10px]" : "text-xs"} text-gray-400 font-medium`}>
        <Clock className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
        {compact ? "" : "Pending Verification"}
      </span>
    );
  }

  if (status === "link_unavailable") {
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? "text-[10px]" : "text-xs"} text-amber-400 font-medium`}>
        <ShieldQuestion className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
        {compact ? "" : "Check Official Site"}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${compact ? "text-[10px]" : "text-xs"} text-red-400 font-medium`}>
      <ShieldX className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
      {compact ? "" : "Expired"}
    </span>
  );
}
