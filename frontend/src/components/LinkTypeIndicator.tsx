import { Link2, Building2, FileText, Mail, Globe } from "lucide-react";

interface LinkTypeIndicatorProps {
  type: "direct" | "homepage" | "pdf" | "email" | "portal";
}

const LINK_LABELS: Record<string, { icon: React.ReactNode; text: string }> = {
  direct: { icon: <Link2 className="w-4 h-4" />, text: "Direct application link — takes you to the application form" },
  homepage: { icon: <Building2 className="w-4 h-4" />, text: "Organization homepage — navigate to Careers/Recruitment section" },
  pdf: { icon: <FileText className="w-4 h-4" />, text: "PDF notification — download and read full advertisement" },
  email: { icon: <Mail className="w-4 h-4" />, text: "Email application — send your CV to the listed email" },
  portal: { icon: <Globe className="w-4 h-4" />, text: "Application portal — create account and apply online" },
};

export default function LinkTypeIndicator({ type }: LinkTypeIndicatorProps) {
  const info = LINK_LABELS[type] || LINK_LABELS.homepage;
  return (
    <div className="bg-surface-elevated/50 border border-border/50 rounded-lg px-4 py-2.5">
      <p className="text-text-muted text-xs flex items-center gap-2">
        <span className="text-accent flex-shrink-0">{info.icon}</span>
        <span>{info.text}</span>
      </p>
    </div>
  );
}
