import type { Metadata } from "next";
import Link from "next/link";
import {
  Zap, ShieldCheck, Globe, BookOpen, Newspaper, MessageSquare,
  ChevronRight, TrendingUp, Briefcase, GraduationCap, Building2, Users
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "About — ElectroBridge | Electronics & Semiconductor Opportunities",
  description: "Learn about ElectroBridge — a free platform aggregating JRF, PhD, government, and private sector opportunities in electronics and semiconductor research across India and internationally.",
  alternates: { canonical: "https://electrobridge.vercel.app/about" },
  openGraph: {
    title: "About ElectroBridge",
    description: "Free platform for JRF, PhD, DRDO, ISRO, CSIR opportunities in electronics & semiconductor.",
    url: "https://electrobridge.vercel.app/about",
  },
};

async function getStats() {
  if (!supabaseAdmin?.from) {
    return { opportunities: 0, organizations: 0, news: 0 };
  }

  const now = new Date().toISOString();

  const [{ count: oppCount }, { count: newsCount }] = await Promise.all([
    supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true).or(`deadline.gte.${now},deadline.is.null`),
    supabaseAdmin.from("news_articles").select("*", { count: "exact", head: true }),
  ]);

  const { data: orgs } = await supabaseAdmin
    .from("opportunities")
    .select("organization")
    .eq("is_active", true)
    .or(`deadline.gte.${now},deadline.is.null`);

  const uniqueOrgs = orgs ? new Set(orgs.map((o: { organization: string }) => o.organization)).size : 0;

  return {
    opportunities: oppCount || 0,
    organizations: uniqueOrgs,
    news: newsCount || 0,
  };
}

const coverageCards = [
  {
    icon: GraduationCap,
    title: "JRF / SRF Positions",
    desc: "Junior and Senior Research Fellowship positions at DRDO, ISRO, CSIR labs, IITs, and NITs with stipends up to ₹42,000/month.",
    href: "/category/jrf",
  },
  {
    icon: BookOpen,
    title: "PhD Opportunities",
    desc: "Fully-funded doctoral positions in electronics and semiconductor research at premier Indian and international institutions.",
    href: "/category/phd",
  },
  {
    icon: ShieldCheck,
    title: "Government Research Jobs",
    desc: "Scientist and engineer positions at DRDO, ISRO, BARC, and CSIR with 7th CPC pay scales and benefits.",
    href: "/category/govt-job",
  },
  {
    icon: Globe,
    title: "International Fellowships",
    desc: "DAAD (Germany), SINGA (Singapore), MEXT (Japan), and Marie Curie (EU) programs for Indian researchers.",
    href: "/category/international",
  },
  {
    icon: TrendingUp,
    title: "Private Sector Roles",
    desc: "VLSI, embedded systems, and chip design jobs at Intel, Qualcomm, AMD, TI, Synopsys, and Nvidia.",
    href: "/category/private",
  },
  {
    icon: Newspaper,
    title: "Tech News",
    desc: "Curated electronics and semiconductor news from IEEE Spectrum, Semiconductor Engineering, EE Times, and more.",
    href: "/news",
  },
];

const verificationSteps = [
  {
    step: "1",
    title: "Automated Scraping",
    desc: "Our bots scan official sources — DRDO, ISRO, CSIR, IIT websites, and RSS feeds — 24/7 for new opportunities and news.",
  },
  {
    step: "2",
    title: "AI Filtering & Tagging",
    desc: "AI-powered filters classify each listing by category, tag relevant topics, and detect expired or broken links automatically.",
  },
  {
    step: "3",
    title: "Manual Verification",
    desc: "Our team manually verifies high-priority listings, checks application links, and confirms deadlines before marking them as verified.",
  },
  {
    step: "4",
    title: "Continuous Monitoring",
    desc: "Links are re-checked periodically. Expired and filled positions are archived to keep our database clean and accurate.",
  },
];

const faqItems = [
  {
    q: "Is ElectroBridge free?",
    a: "Yes, ElectroBridge is completely free for all users. Browse, search, filter, and apply for opportunities without any subscription or payment.",
  },
  {
    q: "How often are opportunities updated?",
    a: "Opportunities are scraped daily. News articles are fetched every few hours. The platform updates in real-time as new listings are found.",
  },
  {
    q: "How do I know if an opportunity is verified?",
    a: "Verified opportunities have a green checkmark badge. Unverified listings (auto-scraped) have a warning badge. Always confirm details on the official website before applying.",
  },
  {
    q: "Can I get email alerts for new opportunities?",
    a: "Yes! Subscribe to our newsletter to receive a weekly digest of new opportunities matching your interests — JRF, PhD, government jobs, or private sector roles.",
  },
  {
    q: "How do I report a broken link or wrong information?",
    a: "Each opportunity page has a report button. You can also use our Contact page to send suggestions or report issues directly to our team.",
  },
  {
    q: "Which organizations does ElectroBridge cover?",
    a: "We cover DRDO labs (LRDE, DEAL, RCI, CAIR), CSIR institutes (NPL, CEERI, CSIO), ISRO centers, IITs, NITs, BARC, and private companies like Intel, Qualcomm, AMD, Texas Instruments, and more.",
  },
];

export default async function AboutPage() {
  const stats = await getStats();

  const statItems = [
    { icon: Briefcase, label: "Active Opportunities", value: `${stats.opportunities}+` },
    { icon: Building2, label: "Organizations Tracked", value: `${stats.organizations}+` },
    { icon: Newspaper, label: "News Articles", value: `${stats.news}+` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ElectroBridge",
    url: "https://electrobridge.vercel.app",
    description: "Electronics and semiconductor opportunity aggregator for Indian researchers",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://electrobridge.vercel.app/opportunities?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-text-primary mb-4">
          About ElectroBridge
        </h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Your gateway to electronics and semiconductor research opportunities in India and globally.
          We connect researchers, engineers, and students with the right positions at the right time.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {statItems.map((stat) => (
          <div key={stat.label} className="bg-surface border border-border rounded-xl p-5 text-center">
            <stat.icon className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary font-display">{stat.value}</p>
            <p className="text-text-secondary text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div className="bg-gradient-to-r from-accent/5 to-accent/5 border border-border rounded-xl p-6 sm:p-8 mb-12">
        <h2 className="font-display text-2xl font-bold text-text-primary mb-4">Our Mission</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          India&apos;s electronics and semiconductor ecosystem is growing rapidly, yet finding the right research
          opportunities remains fragmented across dozens of websites, portals, and notice boards.
        </p>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          ElectroBridge was built to solve this. We aggregate JRF, PhD, government research jobs, and private sector
          opportunities from across India and internationally — all in one searchable, verified platform.
        </p>
        <p className="text-text-secondary text-sm leading-relaxed">
          Our goal is to democratize access to research opportunities and help build India&apos;s next generation of
          electronics and semiconductor innovators.
        </p>
      </div>

      {/* Coverage */}
      <h2 className="font-display text-2xl font-bold text-text-primary mb-6">What We Cover</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {coverageCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-surface border border-border rounded-xl p-5 hover:border-accent/30 transition-all hover:-translate-y-0.5 group"
          >
            <card.icon className="w-8 h-8 text-accent mb-3" />
            <h3 className="font-display text-base font-bold text-text-primary mb-2">{card.title}</h3>
            <p className="text-text-secondary text-xs leading-relaxed">{card.desc}</p>
            <span className="inline-flex items-center gap-1 text-accent text-xs font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Explore <ChevronRight className="w-3 h-3" />
            </span>
          </Link>
        ))}
      </div>

      {/* Verification Process */}
      <h2 className="font-display text-2xl font-bold text-text-primary mb-6">How We Verify Listings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {verificationSteps.map((vs) => (
          <div key={vs.step} className="bg-surface border border-border rounded-xl p-5 flex gap-4">
            <span className="w-8 h-8 rounded-full bg-accent text-bg-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
              {vs.step}
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-text-primary mb-1">{vs.title}</h3>
              <p className="text-text-secondary text-xs leading-relaxed">{vs.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Platform FAQs */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-12">
        <h2 className="font-display text-xl font-bold text-text-primary mb-6">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqItems.map((faq) => (
            <details key={faq.q} className="group">
              <summary className="text-text-primary text-sm font-medium cursor-pointer list-none flex items-center justify-between py-2">
                {faq.q}
                <span className="text-accent text-xs group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed pl-4 border-l-2 border-accent/30">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-border rounded-xl p-6 sm:p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-text-primary mb-3">Have a Suggestion?</h2>
        <p className="text-text-secondary text-sm mb-6 max-w-lg mx-auto">
          Found a missing opportunity? Want to suggest a new feature? We&apos;d love to hear from you.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-accent text-bg-primary font-semibold rounded-lg px-6 py-3 text-sm hover:bg-accent-hover transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Contact Us
        </Link>
      </div>
    </div>
  );
}
