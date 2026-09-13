"use client";

import Link from "next/link";
import { ArrowLeft, Briefcase } from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CategoryClientProps {
  categoryParam: string;
  config: {
    title: string;
    h1: string;
    subline: string;
    description: string;
    slugLabel: string;
  };
  initialOpportunities: any[];
}

export default function CategoryClient({
  config,
  initialOpportunities,
}: CategoryClientProps) {
  const opportunities = initialOpportunities;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors text-sm mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All Opportunities
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-black text-slate-900">{config.h1}</h1>
        <p className="text-slate-600 mt-1 text-sm font-medium">{config.subline}</p>
        <p className="text-blue-600 text-sm mt-2 font-bold">{opportunities.length} Active Positions Verified</p>
      </div>

      <Card className="p-5 mb-8 border border-slate-200 shadow-xs">
        <p className="text-slate-600 text-sm font-medium leading-relaxed">{config.description}</p>
      </Card>

      {opportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {opportunities.map((opp: any) => (
            <Link
              key={opp.id || opp.slug}
              href={`/opportunities/${opp.slug || opp.id}`}
              className="block h-full"
            >
              <Card hover className="p-5 h-full border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <CategoryBadge category={opp.category || config.slugLabel} />
                  {opp.deadline && (
                    <span className="text-xs text-slate-500 font-semibold">
                      {new Date(opp.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
                <h3 className="text-slate-900 text-base font-bold line-clamp-2 leading-snug">{opp.title}</h3>
                <p className="text-slate-600 text-sm mt-1 font-medium">{opp.organization || opp.organizations?.name}</p>
                {(opp.stipend || opp.location) && (
                  <p className="text-slate-500 text-xs mt-2 flex items-center gap-2">
                    {opp.stipend && <span className="text-blue-600 font-bold">{opp.stipend}</span>}
                    {opp.stipend && opp.location && <span>•</span>}
                    {opp.location && <span>{opp.location}</span>}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-14 mb-12 border border-slate-200">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-900 text-lg font-bold mb-1">No active positions under this tag right now.</p>
          <p className="text-slate-600 text-sm font-medium max-w-md mx-auto mb-4">
            New verified opportunities are added daily. Browse all open roles across 104 semiconductor organizations.
          </p>
          <div className="flex justify-center">
            <Button href="/opportunities">Browse All Opportunities</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
