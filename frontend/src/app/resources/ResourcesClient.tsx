"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Compass,
  Code2,
  Users,
  Globe2,
  GraduationCap,
  BarChart3,
  FileText,
  Clock,
  ArrowRight,
  Star,
  Download,
  X,
  CheckCircle2,
  Briefcase,
  Layers,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface ToolModalData {
  title: string;
  category: string;
  description: string;
  downloadUrl?: string;
  items?: string[];
}

const CATEGORIES = [
  {
    id: "career-guidance",
    title: "Career Guidance",
    count: "120+ Articles",
    icon: Compass,
    color: "bg-blue-50 text-blue-600 border-blue-100",
    bgAccent: "bg-blue-500",
    link: "/resources/vlsi-careers",
  },
  {
    id: "skill-development",
    title: "Skill Development",
    count: "95+ Resources",
    icon: Code2,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    bgAccent: "bg-emerald-500",
    link: "/resources/vlsi-career-guide",
  },
  {
    id: "interview-prep",
    title: "Interview Preparation",
    count: "80+ Resources",
    icon: Users,
    color: "bg-purple-50 text-purple-600 border-purple-100",
    bgAccent: "bg-purple-500",
    link: "/resources/drdo-recruitment-electronics",
  },
  {
    id: "study-abroad",
    title: "Study Abroad",
    count: "70+ Resources",
    icon: Globe2,
    color: "bg-orange-50 text-orange-600 border-orange-100",
    bgAccent: "bg-orange-500",
    link: "/resources/fully-funded-phd-vlsi-abroad",
  },
  {
    id: "scholarships",
    title: "Scholarships",
    count: "100+ Resources",
    icon: GraduationCap,
    color: "bg-amber-50 text-amber-600 border-amber-100",
    bgAccent: "bg-amber-500",
    link: "/resources/international-fellowships",
  },
  {
    id: "industry-insights",
    title: "Industry Insights",
    count: "60+ Resources",
    icon: BarChart3,
    color: "bg-rose-50 text-rose-600 border-rose-100",
    bgAccent: "bg-rose-500",
    link: "/resources/net-vs-gate",
  },
  {
    id: "tools-templates",
    title: "Tools & Templates",
    count: "50+ Resources",
    icon: FileText,
    color: "bg-teal-50 text-teal-600 border-teal-100",
    bgAccent: "bg-teal-500",
    link: "#tools-templates",
  },
];

const FEATURED_RESOURCES = [
  {
    id: "resume-guide",
    tag: "CAREER GUIDE",
    tagColor: "bg-purple-50 text-purple-700 border-purple-200",
    readTime: "8 min read",
    title: "How to Create a Standout Resume for Internships",
    description:
      "A step-by-step guide to building a resume that gets you noticed by top companies and research labs.",
    image: "/images/about/story-workspace.png",
    link: "/resources/vlsi-careers",
  },
  {
    id: "top-skills-2026",
    tag: "SKILLS",
    tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    readTime: "10 min read",
    title: "Top 10 Skills to Boost Your Career in 2026",
    description:
      "Discover the most in-demand semiconductor, VLSI, AI hardware, and software skills and how you can start learning them today.",
    image: "/images/news/news-team-study.png",
    link: "/resources/vlsi-career-guide",
  },
  {
    id: "study-abroad-guide",
    tag: "STUDY ABROAD",
    tagColor: "bg-purple-50 text-purple-700 border-purple-200",
    readTime: "12 min read",
    title: "Complete Guide to Study Abroad Opportunities",
    description:
      "Everything you need to know about studying abroad, from application timelines to fully funded fellowships.",
    image: "/images/hero-organizations-campus.png",
    link: "/resources/fully-funded-phd-vlsi-abroad",
  },
];

const TOOLS_AND_TEMPLATES = [
  {
    id: "resume-builder",
    title: "Resume Builder",
    description: "Create a professional resume in minutes.",
    action: "Try Now",
    iconBg: "bg-blue-50 text-blue-600 border-blue-100",
    icon: FileText,
    details: {
      title: "ATS-Compliant Engineering Resume Template",
      category: "Resume Builder",
      description:
        "Download our battle-tested, 1-page LaTeX & Docx template optimized for semiconductor, electronics, and software internships.",
      items: [
        "1-Page ATS formatting optimized for Workday & Greenhouse",
        "Pre-written bullet points for FPGA, VLSI, PCB, and Python projects",
        "Clean single-column typography with 100% parse rate",
      ],
    },
  },
  {
    id: "cover-letter",
    title: "Cover Letter Template",
    description: "Download customizable templates.",
    action: "Download",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
    icon: FileText,
    details: {
      title: "Research Lab & Corporate Cover Letter Template",
      category: "Cover Letter",
      description:
        "Field-tested letter drafts for professor cold outreach, DRDO JRF applications, and multinational company internships.",
      items: [
        "Professor cold-email formula that yields 40%+ reply rate",
        "Research proposal alignment paragraph template",
        "Customizable introduction hook for competitive hiring",
      ],
    },
  },
  {
    id: "interview-prep",
    title: "Interview Prep Guide",
    description: "Practice common interview questions.",
    action: "Get Started",
    iconBg: "bg-purple-50 text-purple-600 border-purple-100",
    icon: FileText,
    details: {
      title: "Technical & HR Interview Question Bank",
      category: "Interview Prep",
      description:
        "Comprehensive collection of 150+ frequently asked questions in VLSI, Digital Electronics, Embedded C, and HR screening rounds.",
      items: [
        "Setup & Hold Time violations and resolution techniques",
        "Verilog state machine design & clock domain crossing questions",
        "Behavioral STAR method answer framework with examples",
      ],
    },
  },
  {
    id: "scholarship-tracker",
    title: "Scholarship Tracker",
    description: "Track and manage your applications.",
    action: "Use Tool",
    iconBg: "bg-amber-50 text-amber-600 border-amber-100",
    icon: FileText,
    details: {
      title: "Application & Fellowship Tracking Spreadsheet",
      category: "Tracker Tool",
      description:
        "Interactive Notion and Google Sheets template to manage deadlines, document checklists, and application statuses.",
      items: [
        "Automated deadline color coding (7-day and 30-day alerts)",
        "Document status checklist: Transcripts, LORs, SOP, CV",
        "Funding calculator: Tuition waiver vs monthly stipend breakdown",
      ],
    },
  },
];

const SUCCESS_STORIES = [
  {
    id: 1,
    quote:
      "The resume template helped me land my first internship at a top company. Thank you BDW!",
    name: "Sneha Verma",
    education: "B.Tech, Delhi University",
    image: "/images/study-learning-female.png",
    stars: 5,
  },
  {
    id: 2,
    quote:
      "The interview preparation resources were a game-changer. I cleared 3 interviews!",
    name: "Arjun Mehta",
    education: "BCA, Pune",
    image: "/images/study-learning-male.png",
    stars: 5,
  },
  {
    id: 3,
    quote:
      "The study abroad guide gave me clarity and confidence. I'm now pursuing my master's in Canada!",
    name: "Riya Kapoor",
    education: "B.Com, Mumbai",
    image: "/images/hero-student-campus.png",
    stars: 5,
  },
];

const DETAILED_GUIDES = [
  {
    href: "/resources/jrf-vs-srf-difference",
    title: "JRF vs SRF vs RA Guide",
    description:
      "Everything about Junior Research Fellowship: eligibility, stipend ₹37,000-42,000/month, age limit, and progression.",
  },
  {
    href: "/resources/drdo-recruitment-electronics",
    title: "DRDO Recruitment Guide",
    description:
      "Complete process to join DRDO as Scientist B: GATE shortlisting, written exam syllabus, and the interview format.",
  },
  {
    href: "/resources/fully-funded-phd-vlsi-abroad",
    title: "Fully-Funded PhD Abroad",
    description:
      "How to secure a salaried PhD position in Europe and Singapore. Email templates and university programs for VLSI.",
  },
  {
    href: "/resources/vlsi-careers",
    title: "VLSI Career Guide",
    description:
      "VLSI career paths in India: roles (design, verification, layout), top companies, salary ranges, and required skills.",
  },
  {
    href: "/resources/net-vs-gate",
    title: "NET vs GATE Comparison",
    description:
      "Which exam should you choose? UGC-NET Electronic Science vs GATE ECE: syllabus, stipend, career paths, and strategy.",
  },
  {
    href: "/resources/international-fellowships",
    title: "International Fellowships",
    description:
      "DAAD, Fulbright-Nehru, Commonwealth, and Japanese MEXT scholarships for Indian engineers and scientists.",
  },
];

export default function ResourcesClient() {
  const [activeModal, setActiveModal] = useState<ToolModalData | null>(null);

  const handleToolClick = (tool: (typeof TOOLS_AND_TEMPLATES)[0]) => {
    setActiveModal(tool.details);
  };

  const handleDownload = () => {
    toast.success("Template package downloaded successfully!");
    setActiveModal(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <span>RESOURCES</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              Learn Today.{" "}
              <span className="text-blue-600 block sm:inline">Build a Brighter Tomorrow.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
              Access guides, tools, career tips and expert insights to help you make the most of every opportunity.
            </p>
          </div>

          {/* Right Column: Hero Image with Cursive Badge */}
          <div className="lg:col-span-5">
            <div className="relative w-full h-[280px] sm:h-[320px] lg:h-[360px] rounded-3xl overflow-hidden shadow-xl border border-slate-100 bg-slate-100">
              <Image
                src="/images/hero-resources-study.png"
                alt="Learn Today. Build a Brighter Tomorrow."
                fill
                priority
                unoptimized
                className="object-cover"
              />

              {/* Floating cursive accent badge */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-white/60 text-right">
                <p className="font-serif italic text-blue-950 text-base sm:text-lg font-bold leading-tight">
                  Small Steps.
                </p>
                <p className="font-serif italic text-blue-600 text-base sm:text-lg font-bold leading-tight">
                  Big Futures.
                </p>
                <div className="w-16 h-1 bg-amber-400 rounded-full mt-1.5 ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BROWSE RESOURCES BY CATEGORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Browse Resources by Category
          </h2>
          <Link
            href="#all-guides"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
          >
            <span>View all resources</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={cat.link}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 text-center flex flex-col items-center justify-between group"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 border transition-transform duration-200 group-hover:scale-110 shadow-xs">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${cat.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight mb-1">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400">{cat.count}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED RESOURCES (3-COL GRID) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Featured Resources
          </h2>
          <Link
            href="#all-guides"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
          >
            <span>View all featured</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_RESOURCES.map((item) => (
            <Link
              key={item.id}
              href={item.link}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group block"
            >
              <div>
                <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-slate-100">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${item.tagColor}`}
                  >
                    {item.tag}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.readTime}</span>
                  </span>
                </div>

                <h3 className="text-slate-900 text-base font-bold leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                  {item.title}
                </h3>

                <p className="text-slate-600 text-xs font-normal leading-relaxed line-clamp-2 mb-4">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 group-hover:text-blue-700 gap-1.5">
                <span>Read More</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. TOOLS & TEMPLATES (4-COL GRID) */}
      <section id="tools-templates" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Tools &amp; Templates
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
              Use our free tools and templates to make your journey easier.
            </p>
          </div>
          <button
            onClick={() => handleToolClick(TOOLS_AND_TEMPLATES[0])}
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group self-start sm:self-auto"
          >
            <span>View all tools</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TOOLS_AND_TEMPLATES.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${tool.iconBg} transition-transform duration-200 group-hover:scale-105`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1.5">
                    {tool.title}
                  </h3>

                  <p className="text-xs text-slate-500 font-normal leading-relaxed mb-4">
                    {tool.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center text-xs font-bold text-blue-600 group-hover:text-blue-700 gap-1.5">
                  <span>{tool.action}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. SUCCESS STORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Success Stories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
              Real stories from students who made the most of these resources.
            </p>
          </div>
          <Link
            href="/opportunities"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group self-start sm:self-auto"
          >
            <span>View all stories</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUCCESS_STORIES.map((story) => (
            <div
              key={story.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <p className="text-slate-700 text-xs sm:text-sm font-normal leading-relaxed italic mb-6">
                  &ldquo;{story.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-slate-200">
                  <Image
                    src={story.image}
                    alt={story.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {story.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">{story.education}</p>
                </div>
                {/* 5-star rating */}
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: story.stars }).map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. COMPLETE GUIDE DIRECTORY (PRESERVING DEEP RESEARCH ARTICLES) */}
      <section id="all-guides" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
            <Layers className="w-4 h-4" />
            <span>Curated Research &amp; Exam Portals</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
            Complete Research &amp; Fellowship Guides
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mb-6">
            In-depth guides covering JRF stipends, PhD abroad, DRDO Scientist B exams, and VLSI career pathways.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DETAILED_GUIDES.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-200 group block"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {guide.title}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {guide.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. MOBILE APP CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-gradient-to-r from-blue-50/80 via-blue-50/50 to-indigo-50/80 border border-blue-100 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="w-10 h-1 bg-blue-600 rounded-full" />
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Take Your Next Step with the{" "}
                <span className="text-blue-600">Right Resources.</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-lg">
                Explore, learn and grow — all in one place. Download our mobile app for anytime access to career roadmaps and verified opportunities.
              </p>

              {/* App Store / Google Play Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#download-play"
                  className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition shadow-xs"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="text-left leading-none">
                    <p className="text-[9px] uppercase tracking-wider text-slate-400">GET IT ON</p>
                    <p className="text-xs font-bold text-white mt-0.5">Google Play</p>
                  </div>
                </a>

                <a
                  href="#download-ios"
                  className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition shadow-xs"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M15.97,4.86C16.62,4.07 17.06,2.97 16.94,1.87C15.97,1.91 14.81,2.52 14.12,3.32C13.53,4.01 13,5.13 13.15,6.22C14.23,6.3 15.32,5.65 15.97,4.86Z" />
                  </svg>
                  <div className="text-left leading-none">
                    <p className="text-[9px] uppercase tracking-wider text-slate-400">Download on the</p>
                    <p className="text-xs font-bold text-white mt-0.5">App Store</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Right: Phone mockup visual */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-56 sm:w-64 h-72 sm:h-80 bg-white rounded-3xl shadow-xl border-4 border-slate-900/10 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                      B
                    </div>
                    <span className="text-[11px] font-bold text-slate-800">BerojgarDegreeWala</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>

                <div className="space-y-2 py-2">
                  <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-100 text-[11px] font-semibold text-blue-800 flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Learn &amp; Upskill</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-medium text-slate-700 flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-slate-500" />
                    <span>Explore Roadmaps</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-medium text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Succeed Together</span>
                  </div>
                </div>

                <div className="text-center pt-2 border-t border-slate-100">
                  <p className="font-serif italic text-blue-600 text-xs font-bold">
                    Knowledge Today. Opportunities Tomorrow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE TOOL MODAL */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={activeModal.title}
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider mb-2 inline-block">
              {activeModal.category}
            </span>

            <h3 className="text-xl font-bold text-slate-900 mb-2">{activeModal.title}</h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
              {activeModal.description}
            </p>

            {activeModal.items && (
              <div className="space-y-2 mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  What&apos;s Included:
                </h4>
                {activeModal.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleDownload}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Template Free</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
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
