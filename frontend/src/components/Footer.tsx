"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { FOOTER_SOCIAL_LINKS } from "@/config/socials";
import { SocialIcon } from "@/components/ui/SocialIcons";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Organizations", href: "/organizations" },
  { label: "News", href: "/news" },
  { label: "Resources", href: "/resources" },
  { label: "About", href: "/about" },
];

const SUPPORT_LINKS = [
  { label: "Help Center", href: "/about#help" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQs", href: "/about#faq" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
  { label: "Report an Issue", href: "/contact?topic=issue" },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 relative z-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-slate-100">

          {/* 1. BRAND IDENTITY & SOCIALS */}
          <div className="lg:col-span-5 space-y-4">
            <Link href="/" className="inline-block">
              <div className="relative h-9 w-44 sm:h-10 sm:w-52">
                <Image
                  src="/images/brand/logo.png"
                  alt="BerojgarDegreeWala"
                  fill
                  unoptimized
                  className="object-contain object-left"
                  sizes="(max-width: 640px) 176px, 208px"
                />
              </div>
            </Link>

            <p className="text-slate-500 text-xs sm:text-sm font-normal leading-relaxed max-w-sm">
              Connecting students with real opportunities in internships, research, jobs, scholarships and more &mdash; across India and worldwide.
            </p>

            {/* Circular Social Media Icons */}
            <div className="flex items-center gap-2.5 pt-2">
              {FOOTER_SOCIAL_LINKS.slice(0, 5).map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`BerojgarDegreeWala on ${social.label}`}
                  className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all shadow-2xs"
                >
                  <SocialIcon platform={social.platform} className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* 2. QUICK LINKS */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-normal text-slate-500">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. SUPPORT */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              Support
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-normal text-slate-500">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. HARDWARE CAREER RADAR */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              Hardware Career Radar
            </h4>
            <p className="text-slate-500 text-xs font-normal leading-relaxed">
              India&apos;s verified intelligence pipeline for semiconductors, VLSI design, embedded firmware, and national research lab vacancies.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/opportunities"
                className="inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 text-xs font-semibold border border-blue-200/60 transition-colors group"
              >
                <span>Browse Verified Vacancies</span>
                <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </Link>
              <Link
                href="/organizations"
                className="inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors group"
              >
                <span>Semiconductor R&amp;D Labs</span>
                <span className="text-slate-500 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </Link>
            </div>
          </div>

        </div>

        {/* BOTTOM ROW */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1 font-medium">
            <span>Made with</span>
            <span className="text-red-500">❤️</span>
            <span>for a brighter tomorrow.</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} BerojgarDegreeWala. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
