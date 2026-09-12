"use client";

import Link from "next/link";
import {
  Briefcase, Bookmark, FileText, Users, MessageSquare,
  Search, ArrowRight, Sparkles, Clock, CheckCircle2,
  GraduationCap, Award, Compass, MapPin, IndianRupee, ExternalLink
} from "lucide-react";
import type { Opportunity } from "@/types";
import OpportunityCard from "@/components/OpportunityCard";
import OpportunityRow from "@/components/OpportunityRow";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface CandidateHomeProps {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    display_name?: string;
    username?: string;
    headline?: string;
    account_type?: string;
    skills?: string[];
    experience_years?: number;
  } | null;
  completenessScore: number;
  matchingOpportunities: Opportunity[];
  closingSoonOpportunities: Opportunity[];
  recommendedInternships: Opportunity[];
  stats: {
    totalActive: number;
    savedCount: number;
    applicationsCount: number;
    connectionsCount: number;
  };
}

export default function CandidateHome({
  user,
  profile,
  completenessScore,
  matchingOpportunities,
  closingSoonOpportunities,
  recommendedInternships,
  stats,
}: CandidateHomeProps) {
  const candidateName = profile?.display_name || profile?.username || user.email?.split("@")[0] || "Candidate";

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-20">
      
      {/* 1. CANDIDATE COCKPIT HERO */}
      <section className="bg-white border-b-2 border-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border-2 border-slate-900 text-blue-800 text-xs font-black uppercase tracking-wider mb-3 shadow-brutal-sm">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Candidate Portal Dashboard
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Welcome back, <span className="text-blue-600">{candidateName}</span>!
              </h1>
              <p className="text-slate-600 text-sm sm:text-base font-medium mt-1">
                Explore personalized fresher openings, closing-soon deadlines, and tracked applications.
              </p>
            </div>

            {/* QUICK METRICS & COMPLETENESS */}
            <div className="flex flex-wrap items-center gap-3">
              <Card className="p-3.5 flex items-center gap-3 shadow-brutal-sm">
                <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center font-black text-blue-700 text-sm">
                  {completenessScore}%
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Profile Completeness</p>
                  <Link href="/profile" className="text-[11px] font-bold text-blue-600 hover:underline">
                    {completenessScore < 100 ? "Complete Profile →" : "View Profile →"}
                  </Link>
                </div>
              </Card>

              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl px-5 py-3 border-2 border-slate-900 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-0.5 transition-all text-xs uppercase tracking-wider"
              >
                <Search className="w-4 h-4" /> Browse All Opportunities
              </Link>
            </div>

          </div>

          {/* QUICK DASHBOARD STATS BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-200">
            <Link href="/applications" className="p-3.5 bg-slate-50 border-2 border-slate-900 rounded-xl shadow-brutal-sm hover:bg-blue-50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">My Applications</span>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.applicationsCount}</p>
            </Link>

            <Link href="/saved" className="p-3.5 bg-slate-50 border-2 border-slate-900 rounded-xl shadow-brutal-sm hover:bg-blue-50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Saved Openings</span>
                <Bookmark className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.savedCount}</p>
            </Link>

            <Link href="/network" className="p-3.5 bg-slate-50 border-2 border-slate-900 rounded-xl shadow-brutal-sm hover:bg-blue-50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Connections</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.connectionsCount}</p>
            </Link>


          </div>

        </div>
      </section>

      {/* 2. MAIN FEED: MATCHING & CLOSING SOON OPPORTUNITIES */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
        
        {/* SECTION A: OPPORTUNITIES MATCHING YOUR PROFILE */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Recommended For You
                </h2>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm font-medium mt-0.5">
                Verified openings matched to your fresher &amp; semiconductor background.
              </p>
            </div>

            <Link
              href="/opportunities?sort=fresher"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View More <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchingOpportunities.slice(0, 6).map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        </div>

        {/* SECTION B: CLOSING SOON (URGENT DEADLINES) */}
        {closingSoonOpportunities.length > 0 && (
          <div className="bg-amber-50/60 border-2 border-slate-900 rounded-2xl p-6 shadow-brutal">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Closing Soon — Apply Before Deadline
                  </h2>
                </div>
                <p className="text-slate-700 text-xs sm:text-sm font-medium mt-0.5">
                  Opportunities expiring within the next 7 days.
                </p>
              </div>

              <Link
                href="/opportunities?deadline=This%20Week"
                className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                View All Closing Soon <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {closingSoonOpportunities.slice(0, 3).map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          </div>
        )}

        {/* SECTION C: RESEARCH FELLOWSHIPS & INTERNSHIPS */}
        {recommendedInternships.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    JRF Fellowships &amp; VLSI Internships
                  </h2>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium mt-0.5">
                  Premier government laboratory fellowships (ISRO, DRDO, CSIR) and fabless silicon internships.
                </p>
              </div>

              <Link
                href="/opportunities?category=jrf"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Explore Fellowships <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedInternships.slice(0, 3).map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
