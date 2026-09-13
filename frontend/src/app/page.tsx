export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { searchOpportunities } from "@/lib/opportunities-query";
import { mapDbOpportunityToClient } from "@/lib/utils";
import { isCurrentlyAvailable, computeIstToday, buildAvailabilityDbFilter } from "@/lib/availability";
import { classifyRoleRelevance } from "@/lib/scrapers/relevance";
import type { Opportunity, NewsArticle } from "@/types";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

import PublicHome from "@/components/home/PublicHome";
import CandidateHome from "@/components/home/CandidateHome";
import EmployerHome from "@/components/home/EmployerHome";
import AdminHome from "@/components/home/AdminHome";

async function getPublicStats() {
  if (!supabaseAdmin?.from) {
    return { total: 0, jrf: 0, phd: 0, govt: 0, verified: 0 };
  }

  const today = computeIstToday();
  const availFilter = buildAvailabilityDbFilter(today);

  const [
    { count: totalActive },
    { count: jrfCount },
    { count: phdCount },
    { count: govtCount },
    { count: verifiedCount },
  ] = await Promise.all([
    supabaseAdmin
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .neq("verification_status", "rejected")
      .neq("verification_status", "pending")
      .neq("verification_status", "expired")
      .neq("verification_status", "link_unavailable")
      .or(availFilter),
    supabaseAdmin
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .neq("verification_status", "rejected")
      .neq("verification_status", "pending")
      .neq("verification_status", "expired")
      .neq("verification_status", "link_unavailable")
      .ilike("category", "%jrf%")
      .or(availFilter),
    supabaseAdmin
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .neq("verification_status", "rejected")
      .neq("verification_status", "pending")
      .neq("verification_status", "expired")
      .neq("verification_status", "link_unavailable")
      .ilike("category", "%phd%")
      .or(availFilter),
    supabaseAdmin
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .neq("verification_status", "rejected")
      .neq("verification_status", "pending")
      .neq("verification_status", "expired")
      .neq("verification_status", "link_unavailable")
      .ilike("category", "%govt%")
      .or(availFilter),
    supabaseAdmin
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .neq("verification_status", "link_unavailable")
      .or(availFilter),
  ]);

  return {
    total: totalActive || 0,
    jrf: jrfCount || 0,
    phd: phdCount || 0,
    govt: govtCount || 0,
    verified: verifiedCount || 0,
  };
}

async function getLatestNews(): Promise<NewsArticle[]> {
  if (!supabaseAdmin?.from) return [];
  try {
    const { data } = await supabaseAdmin
      .from("news_articles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);

    if (!data) return [];
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      summary: item.summary || item.content || "Latest news update from official semiconductor and microelectronics source.",
      source: item.source_name || item.source || "Official Source",
      source_url: item.url || item.source_url || "https://semiengineering.com/",
      image_url: item.image_url || "",
      tags: item.tags || ["Semiconductor", "Research"],
      published_at: item.created_at || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

function calculateProfileScore(p: any): number {
  if (!p) return 20;
  let score = 0;
  if (p.display_name?.trim()) score += 15;
  if (p.headline?.trim()) score += 15;
  if (p.bio?.trim()) score += 15;
  if (p.skills && p.skills.length > 0) score += 20;
  if (p.location?.trim()) score += 10;
  if (p.github_url || p.linkedin_url || p.website_url) score += 15;
  if (p.avatar_url) score += 10;
  return Math.min(score, 100);
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. UNHEALTHY / UNAUTHENTICATED GUEST VISITOR -> RENDER PUBLIC HOME
  if (!user) {
    // RELEVANCE-ONLY homepage feed (Phase 2.6).
    //
    // Contract: PUBLIC HOMEPAGE = VERIFIED + ACTIVE + RELEVANT
    //
    // No "fill empty slots with arbitrary verified+active" fallback.
    // If fewer than 6 relevant opportunities exist, show fewer.
    // Quality > Quantity. Two relevant cards > six cards with four
    // generic government jobs.
    //
    // Strategy: Fetch all verified+active+available from DB (up to 200),
    // then filter through classifyRoleRelevance() in application code.
    // DB handles eligibility (verified, active, available).
    // Classifier handles domain relevance (electronics/VLSI/research).
    // Only "relevant" (not "possibly_relevant") makes the homepage.

    const HOMEPAGE_LIMIT = 200; // fetch enough for classification
    const HOMEPAGE_TARGET = 6;

    const { data: candidateOpps } = await supabaseAdmin
      .from("opportunities")
      .select("*, organizations(*)")
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .not("verification_status", "eq", "rejected")
      .not("verification_status", "eq", "pending")
      .not("verification_status", "eq", "link_unavailable")
      .not("verification_status", "eq", "expired")
      .or(buildAvailabilityDbFilter(computeIstToday()))
      .order("created_at", { ascending: false })
      .limit(HOMEPAGE_LIMIT);

    // Application-level relevance filter: ONLY "relevant" opportunities.
    // This is the canonical relevance gate for the homepage.
    // "possibly_relevant" is EXCLUDED from the homepage (search only).
    const homepageOpps = (candidateOpps || [])
      .filter((opp: any) => isCurrentlyAvailable(opp))
      .filter((opp: any) => {
        const relevance = classifyRoleRelevance(
          opp.title,
          opp.description,
          opp.organization || opp.organizations?.name || null,
          opp.tags,
        );
        return relevance === "relevant";
      })
      .slice(0, HOMEPAGE_TARGET);

    const [publicStats, latestNews] = await Promise.all([
      getPublicStats(),
      getLatestNews(),
    ]);

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How are JRF, PhD, and industry opportunities sourced and validated?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Every single listing ingested by BerojgarDegreeWala passes through automated scraper checks followed by link validation. We surface listings from official university domain portals (e.g. iitb.ac.in, iisc.ac.in, drdo.gov.in, isro.gov.in) and verified corporate career nodes (e.g. intel.com, qualcomm.com). Always confirm details on the original circular before applying.",
          },
        },
        {
          "@type": "Question",
          name: "Can I apply for DRDO or ISRO JRF positions as a final-year B.Tech / M.Tech student?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! Most Junior Research Fellowship (JRF) positions in DRDO and ISRO accept candidates with a valid GATE score or NET qualification. Final-year students can apply provided they meet degree completion criteria by the document verification date specified in the official circular.",
          },
        },
        {
          "@type": "Question",
          name: "What is the standard stipend structure for JRF and SRF positions in India?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "As per updated DST/CSIR guidelines, JRF positions receive ₹37,000/month + HRA (ranging from 9% to 27% depending on city tier). Senior Research Fellowships (SRF) receive ₹42,000/month + HRA. Many IIT/IISc JRF roles can also be converted directly into full PhD registrations.",
          },
        },
        {
          "@type": "Question",
          name: "How do I receive instant alerts for new openings matching my exact profile?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You can subscribe to our free Email & Telegram notification system. Specify your target keywords (e.g. 'SystemVerilog', 'IIT Bombay', 'DRDO') and categories ('JRF', 'PhD', 'Private Sector') to receive automated real-time alerts when matching listings are detected by our scrapers.",
          },
        },
      ],
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <PublicHome
          stats={publicStats}
          latestOpenings={homepageOpps.map((d: any) => mapDbOpportunityToClient(d))}
          latestNews={latestNews}
        />
      </>
    );
  }

  // 2. AUTHENTICATED USER -> RESOLVE ROLE
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const role = (user.user_metadata?.role || profile?.role || profile?.account_type || user.user_metadata?.account_type || "candidate").toLowerCase();

  // -------------------------------------------------------------
  // A. EMPLOYER / LAB RECRUITER PORTAL HOME
  // -------------------------------------------------------------
  if (role === "employer" || role === "provider") {
    let activeJobsCount = 0;
    let recentJobs: any[] = [];
    let totalApplicants = 0;
    let screeningCount = 0;
    let interviewCount = 0;

    if (supabaseAdmin?.from) {
      const { data: allEmployerJobs } = await supabaseAdmin
        .from("opportunities")
        .select("id, title, category, location, deadline, created_at")
        .or(`created_by.eq.${user.id},employer_id.eq.${user.id}`)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (allEmployerJobs) {
        recentJobs = allEmployerJobs.slice(0, 5);
        activeJobsCount = allEmployerJobs.length;
        const jobIds = allEmployerJobs.map((j: any) => j.id);

        if (jobIds.length > 0) {
          const { data: appsData } = await supabaseAdmin
            .from("applications")
            .select("id, status")
            .in("opportunity_id", jobIds);

          if (appsData) {
            totalApplicants = appsData.length;
            screeningCount = appsData.filter((a: any) => a.status === "screening" || a.status === "reviewing").length;
            interviewCount = appsData.filter((a: any) => a.status === "interview" || a.status === "interviewing").length;
          }
        }
      }
    }

    return (
      <EmployerHome
        user={user}
        profile={profile}
        stats={{
          activeJobs: activeJobsCount,
          totalApplicants,
          screeningCount,
          interviewCount,
        }}
        recentJobs={recentJobs}
      />
    );
  }

  // -------------------------------------------------------------
  // B. ADMIN / GOVERNANCE HOME
  // -------------------------------------------------------------
  if (role === "admin") {
    const today = computeIstToday();
    let totalOpp = 0;
    let activeOpp = 0;
    let expiredOpp = 0;
    let pendingOpp = 0;
    let totalUsersCount = 0;

    if (supabaseAdmin?.from) {
      const [
        { count: cTotal },
        { count: cActive },
        { count: cExpired },
        { count: cPending },
        { count: cUsers },
      ] = await Promise.all([
        supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true })
          .eq("is_active", true).neq("verification_status", "rejected")
          .neq("verification_status", "expired").neq("verification_status", "link_unavailable")
          .or(buildAvailabilityDbFilter(today)),
        supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true })
          .or(`verification_status.eq.expired,deadline.lt.${today}`),
        supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
        supabaseAdmin.from("user_profiles").select("*", { count: "exact", head: true }),
      ]);

      if (cTotal !== null) totalOpp = cTotal;
      if (cActive !== null) activeOpp = cActive;
      if (cExpired !== null) expiredOpp = cExpired;
      if (cPending !== null) pendingOpp = cPending;
      if (cUsers !== null) totalUsersCount = cUsers;
    }

    return (
      <AdminHome
        stats={{
          totalOpportunities: totalOpp,
          activeOpportunities: activeOpp,
          expiredOpportunities: expiredOpp,
          pendingVerification: pendingOpp,
          totalUsers: totalUsersCount,
          activeScrapers: 6,
        }}
      />
    );
  }

  // -------------------------------------------------------------
  // C. CANDIDATE HOME (DEFAULT AUTHENTICATED USER EXPERIENCE)
  // -------------------------------------------------------------
  const [
    matchingRes,
    closingSoonRes,
    internshipsRes,
    appsCountRes,
    savedCountRes,
  ] = await Promise.all([
    searchOpportunities({ limit: 6, sort: "fresher" }),
    searchOpportunities({ deadline: "This Week", limit: 3 }),
    searchOpportunities({ category: "jrf", limit: 3 }),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("saved_opportunities").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const completeness = calculateProfileScore(profile);

  return (
    <CandidateHome
      user={user}
      profile={profile}
      completenessScore={completeness}
      matchingOpportunities={matchingRes.data.map((d: any) => mapDbOpportunityToClient(d))}
      closingSoonOpportunities={closingSoonRes.data.map((d: any) => mapDbOpportunityToClient(d))}
      recommendedInternships={internshipsRes.data.map((d: any) => mapDbOpportunityToClient(d))}
      stats={{
        totalActive: matchingRes.count,
        savedCount: savedCountRes.count || 0,
        applicationsCount: appsCountRes.count || 0,
        connectionsCount: profile?.connection_count || 0,
      }}
    />
  );
}