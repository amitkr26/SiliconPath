"use client";

import Link from "next/link";
import Image from "next/image";
import { FOOTER_SOCIAL_LINKS } from "@/config/socials";
import { SocialIcon } from "@/components/ui/SocialIcons";
import SubscribeSection from "./SubscribeSection";

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
    <footer className="bg-slate-900 text-slate-400 relative z-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-16">

        {/* CTA + NEWSLETTER BAND */}
        <div className="pb-12">
          <SubscribeSection />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-t border-slate-800 pt-12">

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

            <p className="text-slate-400 text-xs sm:text-sm font-normal leading-relaxed max-w-sm">
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
                  className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800/60 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-400 hover:bg-slate-800 transition-all shadow-2xs"
                >
                  <SocialIcon platform={social.platform} className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* 2. QUICK LINKS */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white tracking-tight">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-normal text-slate-400">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. SUPPORT */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white tracking-tight">
              Support
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-normal text-slate-400">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. DOWNLOAD OUR APP */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white tracking-tight">
              Download Our App
            </h4>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 pt-1">
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get it on Google Play"
                className="inline-flex items-center gap-2.5 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors w-fit shadow-2xs border border-slate-700"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.984 1.984 0 0 1-.61-.925V2.739c0-.337.217-.655.609-.925zm11.233 11.233l2.096-2.096-10.98-6.34 8.884 8.436zm0 1.906L5.958 23.39l10.98-6.34-2.096-2.097zm1.047-.953l2.766-1.597a1.037 1.037 0 0 0 0-1.796l-2.766-1.598-1.758 1.758 1.758 1.793z" />
                </svg>
                <div className="text-left">
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-medium leading-none">GET IT ON</div>
                  <div className="text-xs font-bold leading-tight">Google Play</div>
                </div>
              </a>

              <a
                href="https://apple.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download on the App Store"
                className="inline-flex items-center gap-2.5 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors w-fit shadow-2xs border border-slate-700"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.98.6-2.62 1.35-.57.65-1.07 1.72-.94 2.74 1 .08 2.02-.49 2.64-1.24z" />
                </svg>
                <div className="text-left">
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-medium leading-none">Download on the</div>
                  <div className="text-xs font-bold leading-tight">App Store</div>
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* BOTTOM ROW */}
        <div className="pt-8 pb-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-800">
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