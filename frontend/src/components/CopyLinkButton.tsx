"use client";

import { Check, Link } from "lucide-react";
import { useState } from "react";

interface CopyLinkButtonProps {
  url: string;
}

export default function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/40 text-text-primary rounded-lg text-xs font-medium hover:bg-gray-700/60 transition-colors border border-gray-600/30"
      title="Copy link"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : (
        <Link className="w-3.5 h-3.5" />
      )}
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}
