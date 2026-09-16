"use client";

import { SOCIAL_LINKS } from "@/config/socials";
import { SocialIcon } from "@/components/ui/SocialIcons";
import { Card } from "@/components/ui/Card";
import { Users } from "lucide-react";

/**
 * "Join the Community" / "Our Online Presence" section.
 * Used on the About page and anywhere else that needs a social CTA.
 */
export function SocialPresenceSection() {
  return (
    <Card className="p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="font-display text-2xl font-black text-slate-900 mb-2">
          Stay Connected
        </h2>
        <p className="text-slate-500 text-sm font-medium max-w-lg mx-auto">
          Follow career, technology, research and opportunity updates across our
          social channels.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {SOCIAL_LINKS.map((social) => (
          <a
            key={social.platform}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`BerojgarDegreeWala on ${social.label}`}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-card hover:-translate-y-0.5 transition-all"
          >
            <SocialIcon
              platform={social.platform}
              className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors"
            />
            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
              {social.label}
            </span>
          </a>
        ))}
      </div>
    </Card>
  );
}
