"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Please provide a valid email address.");
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Subscribed successfully! You'll receive real-time deep-tech opportunity digests.");
        setEmail("");
      } else if (res.status === 409) {
        toast.info("This email is already subscribed to BerojgarDegreeWala digests.");
        setEmail("");
      } else {
        toast.error(data.error || "Subscription failed. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-300 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-800">
          
          {/* LEFT: BRAND & MISSION (4 COLS) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group inline-flex">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-700/80 shadow-xs shrink-0 bg-slate-900">
                <Image
                  src="/images/brand/favicon.png"
                  alt="BerojgarDegreeWala Icon"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="32px"
                />
              </div>
              <span className="font-bold text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                Berojgar<span className="text-blue-500">DegreeWala</span>
              </span>
            </Link>

            <p className="text-slate-400 text-xs font-normal leading-relaxed max-w-sm">
              India&apos;s premier deep-tech career and research ecosystem. Connecting ambitious engineers, researchers, and graduates with verified circulars in semiconductors, VLSI, and core technologies.
            </p>

            <div className="pt-2">
              <p className="font-serif italic text-amber-400 text-xs font-semibold">
                #SameDegreeABrighterTomorrow
              </p>
            </div>

            {/* Quick pill links */}
            <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-medium text-slate-400">
              <Link href="/organizations/drdo" className="px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-blue-500 hover:text-white rounded transition">
                DRDO
              </Link>
              <Link href="/organizations/isro" className="px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-blue-500 hover:text-white rounded transition">
                ISRO
              </Link>
              <Link href="/organizations/iit-bombay" className="px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-blue-500 hover:text-white rounded transition">
                IITs &amp; IISc
              </Link>
              <Link href="/opportunities?search=VLSI" className="px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-blue-500 hover:text-white rounded transition">
                VLSI
              </Link>
            </div>
          </div>

          {/* COLUMN 1: OPPORTUNITIES (2 COLS) */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Opportunities
            </p>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <Link href="/opportunities?category=jrf" className="hover:text-white transition">
                  JRF &amp; SRF Fellowships
                </Link>
              </li>
              <li>
                <Link href="/opportunities?search=VLSI" className="hover:text-white transition">
                  VLSI &amp; Semiconductor
                </Link>
              </li>
              <li>
                <Link href="/opportunities?category=phd" className="hover:text-white transition">
                  PhD &amp; Research Openings
                </Link>
              </li>
              <li>
                <Link href="/opportunities?category=govt" className="hover:text-white transition">
                  Government PSUs &amp; Labs
                </Link>
              </li>
              <li>
                <Link href="/opportunities?category=internship" className="hover:text-white transition">
                  Hardware Internships
                </Link>
              </li>
              <li>
                <Link href="/opportunities?category=fellowship" className="hover:text-white transition">
                  Study Abroad &amp; Grants
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 2: GUIDES & ACADEMY (2 COLS) */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Guides &amp; Academy
            </p>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <Link href="/resources/jrf-guide" className="hover:text-white transition">
                  JRF Complete DST Guide
                </Link>
              </li>
              <li>
                <Link href="/resources/jrf-vs-srf-difference" className="hover:text-white transition">
                  JRF vs SRF vs RA
                </Link>
              </li>
              <li>
                <Link href="/resources/drdo-recruitment-electronics" className="hover:text-white transition">
                  DRDO ECE Syllabus
                </Link>
              </li>
              <li>
                <Link href="/resources/phd-guide" className="hover:text-white transition">
                  IIT/IISc PhD Guide
                </Link>
              </li>
              <li>
                <Link href="/resources/fully-funded-phd-vlsi-abroad" className="hover:text-white transition">
                  Funded PhD Abroad
                </Link>
              </li>
              <li>
                <Link href="/resources/vlsi-careers" className="hover:text-white transition">
                  VLSI Career Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: PORTALS & TOOLS (2 COLS) */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Portals &amp; Tools
            </p>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <Link href="/opportunities" className="hover:text-white transition">
                  Verified Opportunities
                </Link>
              </li>
              <li>
                <Link href="/organizations" className="hover:text-white transition">
                  Organizations Directory
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-white transition">
                  Daily News &amp; Circulars
                </Link>
              </li>
              <li>
                <Link href="/ask-ai" className="hover:text-white transition">
                  Deep-Tech AI Assistant
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white transition">
                  Research Resources Hub
                </Link>
              </li>
              <li>
                <a href="https://siliconpath.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  SiliconPath Platform &rarr;
                </a>
              </li>
            </ul>
          </div>

          {/* RIGHT: NEWSLETTER SIGNUP (2 COLS) */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Stay Updated
            </p>
            <p className="text-xs text-slate-400 font-normal leading-relaxed">
              Receive verified research circulars and core VLSI job alerts weekly.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 rounded-lg shadow-xs transition flex items-center justify-center gap-1 disabled:opacity-60"
              >
                <span>{subscribing ? "Subscribing..." : "Subscribe"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="pt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400 text-[11px] font-medium">
                Live Scrapers Active
              </span>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-normal text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} BerojgarDegreeWala. All rights reserved.
          </div>

          <div className="flex items-center gap-3 text-slate-400 font-medium text-xs">
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <span>&bull;</span>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <span>&bull;</span>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
            <span>&bull;</span>
            <Link href="/about" className="hover:text-white transition">About</Link>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <span>🇮🇳 Building a Brighter India, Together.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
