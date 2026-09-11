"use client";

import Link from "next/link";
import {
  ShieldCheck, AlertTriangle, Briefcase, Users,
  Layers, Radio, Bell, ArrowRight, CheckCircle2,
  FileText, Activity, Clock
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface AdminHomeProps {
  stats: {
    totalOpportunities: number;
    activeOpportunities: number;
    expiredOpportunities: number;
    pendingVerification: number;
    totalUsers: number;
    activeScrapers: number;
  };
}

export default function AdminHome({ stats }: AdminHomeProps) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-20">
      
      {/* 1. ADMIN HERO */}
      <section className="bg-white border-b-2 border-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border-2 border-slate-900 text-red-800 text-xs font-black uppercase tracking-wider mb-3 shadow-brutal-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-red-600" /> Platform Governance &amp; Administration
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Admin Control Center
              </h1>
              <p className="text-slate-600 text-sm sm:text-base font-medium mt-1">
                Monitor database integrity, review pending scraper circulars, and manage platform health.
              </p>
            </div>

            {/* ACTION BUTTON */}
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl px-5 py-3 border-2 border-slate-900 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-0.5 transition-all text-xs uppercase tracking-wider"
              >
                <Activity className="w-4 h-4" /> Open Full Admin Suite
              </Link>
            </div>

          </div>

          {/* ADMIN KEY METRICS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-200">
            <Link href="/admin?tab=opportunities" className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl shadow-brutal-sm hover:bg-blue-50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Active Verified</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.activeOpportunities}</p>
            </Link>

            <Link href="/admin?tab=moderation" className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl shadow-brutal-sm hover:bg-amber-50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Pending Moderation</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.pendingVerification}</p>
            </Link>

            <Link href="/admin?tab=opportunities" className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl shadow-brutal-sm hover:bg-slate-100 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Expired / Archived</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.expiredOpportunities}</p>
            </Link>

            <Link href="/admin?tab=scrapers" className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl shadow-brutal-sm hover:bg-purple-50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Scraper Fleet</span>
                <Radio className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.activeScrapers} Active</p>
            </Link>
          </div>

        </div>
      </section>

      {/* 2. ADMIN ACTIONS GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <h2 className="text-lg font-black text-slate-900 mb-4">Administration Workflows</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin?tab=moderation"
            className="p-6 bg-white border-2 border-slate-900 rounded-2xl shadow-brutal hover:shadow-brutal-lg hover:-translate-y-0.5 transition-all"
          >
            <AlertTriangle className="w-6 h-6 text-amber-500 mb-3" />
            <h3 className="text-base font-bold text-slate-900">Job Verification Queue</h3>
            <p className="text-xs text-slate-600 mt-1">Review raw scraped circulars and approve them into the verified public stream.</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 mt-4">
              Review Queue →
            </span>
          </Link>

          <Link
            href="/admin?tab=scrapers"
            className="p-6 bg-white border-2 border-slate-900 rounded-2xl shadow-brutal hover:shadow-brutal-lg hover:-translate-y-0.5 transition-all"
          >
            <Radio className="w-6 h-6 text-purple-600 mb-3" />
            <h3 className="text-base font-bold text-slate-900">Scraper Fleet Health</h3>
            <p className="text-xs text-slate-600 mt-1">Inspect cron run logs, response times, and failure rates for DRDO, ISRO, and CSIR feeds.</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 mt-4">
              Inspect Scrapers →
            </span>
          </Link>

          <Link
            href="/admin?tab=announcements"
            className="p-6 bg-white border-2 border-slate-900 rounded-2xl shadow-brutal hover:shadow-brutal-lg hover:-translate-y-0.5 transition-all"
          >
            <Bell className="w-6 h-6 text-emerald-600 mb-3" />
            <h3 className="text-base font-bold text-slate-900">Platform Announcements</h3>
            <p className="text-xs text-slate-600 mt-1">Broadcast system-wide notices and new academy track releases to all active users.</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 mt-4">
              Manage Notices →
            </span>
          </Link>
        </div>
      </div>

    </div>
  );
}
