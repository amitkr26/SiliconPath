"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Building2,
  Globe,
  Star,
  Play,
  ArrowRight,
  ShieldCheck,
  Lightbulb,
  GraduationCap,
  TrendingUp,
  Sparkles,
  Linkedin,
  X,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

interface StatItem {
  value: string;
  label: string;
  icon: any;
  color: string;
}

interface TeamMember {
  name: string;
  role: string;
  initials: string;
  linkedin: string;
  avatarClass: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Amit Kumar",
    role: "Founder & CEO",
    initials: "AK",
    linkedin: "https://www.linkedin.com/in/amitkr26",
    avatarClass: "from-blue-600 to-indigo-600",
  },
  {
    name: "Azad Gupta",
    role: "Core Team",
    initials: "AG",
    linkedin: "https://www.linkedin.com/in/azad-gupta-6619692ba",
    avatarClass: "from-emerald-600 to-teal-600",
  },
  {
    name: "Rohit Maurya",
    role: "Core Team",
    initials: "RM",
    linkedin: "https://www.linkedin.com/in/rohit-maurya-rm721",
    avatarClass: "from-purple-600 to-violet-600",
  },
  {
    name: "Sanju",
    role: "Core Team",
    initials: "S",
    linkedin: "https://www.linkedin.com/in/sanju3100",
    avatarClass: "from-amber-500 to-orange-600",
  },
  {
    name: "Rohit Pratap",
    role: "Core Team",
    initials: "RP",
    linkedin: "https://www.linkedin.com/in/rohit-pratap-866294212",
    avatarClass: "from-cyan-600 to-blue-600",
  },
];

const MISSION_PILLARS = [
  {
    icon: GraduationCap,
    title: "Inform",
    description: "Share verified and up-to-date opportunities",
    bg: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    icon: Users,
    title: "Connect",
    description: "Bring students and organizations together",
    bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    icon: TrendingUp,
    title: "Empower",
    description: "Help you build skills and a successful career",
    bg: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    icon: Globe,
    title: "Create Impact",
    description: "Enable a brighter future for students everywhere",
    bg: "bg-purple-50 text-purple-600 border-purple-100",
  },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Trust & Transparency",
    description: "We share only verified and genuine opportunities.",
    iconBg: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    icon: Users,
    title: "Student First",
    description: "Every decision we make puts students at the center.",
    iconBg: "bg-cyan-50 text-cyan-600 border-cyan-100",
  },
  {
    icon: Lightbulb,
    title: "Continuous Learning",
    description: "We believe in growth, curiosity and new possibilities.",
    iconBg: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    icon: Globe,
    title: "Inclusivity",
    description: "Opportunities for every student, across all backgrounds.",
    iconBg: "bg-teal-50 text-teal-600 border-teal-100",
  },
];

const FAQ_ITEMS = [
  {
    q: "Is BerojgarDegreeWala free for students?",
    a: "Yes! BerojgarDegreeWala is 100% free for students and job-seekers. You can explore, filter, bookmark, and apply for opportunities without any hidden fees or paywalls.",
  },
  {
    q: "How are opportunities verified?",
    a: "Our multi-tiered verification pipeline aggregates circulars directly from official DRDO, ISRO, CSIR, and IIT portals, runs automated link sanity tests, and performs editorial reviews before marking listings verified.",
  },
  {
    q: "Can organizations post opportunities directly?",
    a: "Yes. Premier universities, research labs, and verified technology enterprises can partner with BDW to post research internships, JRF vacancies, and entry-level engineering roles.",
  },
  {
    q: "How frequently is content updated?",
    a: "Our feeds synchronize daily for research fellowships, semiconductor news, and career opportunities, ensuring you never miss critical application deadlines.",
  },
];

export default function AboutClient() {
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const stats: StatItem[] = [
    {
      value: "10,000+",
      label: "Students Empowered",
      icon: Users,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      value: "500+",
      label: "Trusted Organizations",
      icon: Building2,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
    {
      value: "100+",
      label: "Opportunity Categories",
      icon: Globe,
      color: "text-teal-600 bg-teal-50 border-teal-100",
    },
    {
      value: "1 Million+",
      label: "Brighter Tomorrows",
      icon: Star,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <span>ABOUT US</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              A Brighter Tomorrow for{" "}
              <span className="text-blue-600 block sm:inline">Every Learner.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl mb-8">
              BerojgarDegreeWala is a student-first platform dedicated to connecting you with real opportunities — internships, research, jobs, scholarships and more — across India and worldwide.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link
                href="#mission"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition"
              >
                <span>Our Mission</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={() => setShowStoryModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-blue-600 font-semibold rounded-xl border border-slate-200 shadow-2xs transition"
              >
                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Play className="w-2.5 h-2.5 fill-blue-600" />
                </div>
                <span>Watch Our Story</span>
              </button>
            </div>

            {/* 4 Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200/80">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${stat.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        {stat.value}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Hero Team Image */}
          <div className="lg:col-span-5">
            <div className="relative w-full h-[300px] sm:h-[350px] lg:h-[400px] rounded-3xl overflow-hidden shadow-xl border border-slate-100 bg-slate-100">
              <Image
                src="/images/about/hero-team.png"
                alt="BerojgarDegreeWala Team and Students"
                fill
                priority
                unoptimized
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. OUR STORY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left: 2 Side-by-Side Story Images */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-slate-100">
              <Image
                src="/images/about/story-books.png"
                alt="Opportunities Create Better Humans"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-slate-100">
              <Image
                src="/images/about/story-workspace.png"
                alt="A Brighter Tomorrow Together"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          </div>

          {/* Right: Story Narrative */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <span>OUR STORY</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
              Why We Started{" "}
              <span className="text-blue-600">BerojgarDegreeWala</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              We started BerojgarDegreeWala with a simple belief — that every student deserves easy access to genuine opportunities and the right information to build a meaningful career.
            </p>

            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              As students ourselves, we saw how difficult it was to find verified internships, scholarships and research opportunities. So, we built a platform to make this journey easier for everyone.
            </p>

            {/* Quote Box */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5 sm:p-6 flex items-start gap-4">
              <span className="text-3xl font-serif text-blue-600 font-bold leading-none shrink-0">
                “
              </span>
              <div>
                <p className="font-serif italic text-blue-950 text-sm sm:text-base font-semibold leading-relaxed">
                  &ldquo;Opportunities don&apos;t happen. We help you find them.&rdquo;
                </p>
                <div className="w-16 h-1 bg-blue-600 rounded-full mt-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OUR MISSION SECTION */}
      <section id="mission" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading + Call to Action */}
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <span>OUR MISSION</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
              Creating Equal Access{" "}
              <span className="text-blue-600 block">to Opportunities</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              We aim to bridge the gap between students and opportunities by providing a reliable, easy-to-use and comprehensive platform for career growth.
            </p>

            <div>
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition"
              >
                <span>Join Our Community</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: 4 Pillars */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MISSION_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col items-center text-center justify-between"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 border ${pillar.bg}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-normal leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. OUR VALUES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
            <div className="w-8 h-1 bg-blue-600 rounded-full" />
            <span>OUR VALUES</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            What Drives Us
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUES.map((val) => {
            const Icon = val.icon;
            return (
              <div
                key={val.title}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border ${val.iconBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
                    {val.title}
                  </h3>

                  <p className="text-xs text-slate-500 font-normal leading-relaxed">
                    {val.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. MEET THE TEAM SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <span>MEET THE TEAM</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              The People Behind <span className="text-blue-600">BDW</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 max-w-xl">
              A passionate team of students, creators and career enthusiasts working to make opportunities accessible for all.
            </p>
          </div>

          <Link
            href="/contact"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group self-start sm:self-auto"
          >
            <span>Join Our Team</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 text-center flex flex-col items-center justify-between group"
            >
              <div>
                <div
                  className={`relative w-20 h-20 rounded-full overflow-hidden mb-4 mx-auto border-2 border-white shadow-md bg-gradient-to-br ${member.avatarClass} group-hover:scale-105 transition-transform duration-300`}
                >
                  <div className="w-full h-full flex items-center justify-center font-bold text-white text-lg tracking-wide">
                    {member.initials}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                  {member.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-tight mb-3">
                  {member.role}
                </p>
              </div>

              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} LinkedIn profile`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-600 text-slate-500 hover:text-white text-[10px] font-semibold transition-colors"
              >
                <Linkedin className="w-3 h-3" />
                <span>LinkedIn</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 6. BE A PART OF OUR JOURNEY (CTA BANNER) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-gradient-to-r from-blue-50/90 via-blue-50/60 to-indigo-50/90 border border-blue-100 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Be a Part of <span className="text-blue-600">Our Journey</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-xl">
                Together, we can create a brighter tomorrow for millions of students. Join our growing network of learners, scholars, and hiring partners today.
              </p>

              <div className="pt-2">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition"
                >
                  <span>Create Your Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: Airplane Graphic & Cursive Callout */}
            <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center text-center lg:text-right">
              <div className="relative mb-2">
                <svg
                  className="w-16 h-16 text-blue-500 animate-pulse"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </div>
              <p className="font-serif italic text-blue-950 text-base sm:text-lg font-bold leading-tight">
                More Opportunities.
              </p>
              <p className="font-serif italic text-blue-600 text-base sm:text-lg font-bold leading-tight">
                Brighter Futures.
              </p>
              <div className="w-20 h-1 bg-amber-400 rounded-full mt-1.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS (PRESERVING SEO & ACCESSIBILITY) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PLATFORM FAQS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div
                key={faq.q}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs transition-colors"
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isExpanded}
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-blue-600 transition-transform duration-200 shrink-0 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. WATCH OUR STORY MODAL */}
      {showStoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowStoryModal(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Watch Our Story"
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setShowStoryModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-blue-700 mb-3">
              <Play className="w-3 h-3 fill-blue-700" />
              <span>THE BEROJGARDEGREEWALA JOURNEY</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Building Opportunities for Every Student
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              From our humble beginnings as college classmates frustrated by scattered opportunity circulars to building India&apos;s fastest growing verified student portal.
            </p>

            <div className="space-y-2.5 bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>100% free forever for students &amp; research applicants</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Verified DRDO, CSIR, ISRO, and private R&amp;D listings</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Empowering over 10,000+ engineers, researchers, and scholars</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/opportunities"
                onClick={() => setShowStoryModal(false)}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs text-center shadow-xs transition"
              >
                Explore Opportunities
              </Link>
              <button
                onClick={() => setShowStoryModal(false)}
                className="py-2.5 px-4 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
