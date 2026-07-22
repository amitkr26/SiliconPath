"use client";

import { MessageCircle, Twitter } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  organization: string;
  deadline: string | null;
  opportunityUrl: string;
}

export default function ShareButtons({
  title,
  organization,
  deadline,
  opportunityUrl,
}: ShareButtonsProps) {
  const shareText = `New JRF/PhD opportunity: ${title} at ${organization} | Deadline: ${deadline || "TBD"} | Apply: ${opportunityUrl} | More opportunities: https://berojgardegreewala.vercel.app`;
  const tweetText = `New opportunity: ${title} at ${organization} | Deadline: ${deadline || "TBD"} #JRF #Electronics #Semiconductor`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(opportunityUrl)}`;

  return (
    <div className="flex items-center gap-2">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-7 h-7 rounded-xl bg-bg-primary border border-border flex items-center justify-center hover:bg-surface-elevated transition-colors text-text-secondary hover:text-accent"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5" />
      </a>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-7 h-7 rounded-xl bg-bg-primary border border-border flex items-center justify-center hover:bg-surface-elevated transition-colors text-text-secondary hover:text-accent"
        title="Share on Twitter/X"
      >
        <Twitter className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
