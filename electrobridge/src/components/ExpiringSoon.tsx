import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import type { Opportunity } from "@/types";
import OpportunityCard from "./OpportunityCard";

async function getExpiringOpportunities(): Promise<Opportunity[]> {
  if (!supabaseAdmin?.from) return [];
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data } = await supabaseAdmin
    .from("opportunities")
    .select("*")
    .eq("is_active", true)
    .gte("deadline", today)
    .lte("deadline", sevenDaysLater)
    .order("deadline", { ascending: true })
    .limit(3);

  return (data as Opportunity[]) || [];
}

export default async function ExpiringSoon() {
  const opportunities = await getExpiringOpportunities();

  if (opportunities.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
      <div className="bg-gradient-to-r from-[#F59E0B]/20 via-[#EF4444]/20 to-transparent border border-[#F59E0B]/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-display text-2xl font-bold flex items-center gap-2">
            <span className="text-orange-400">⚡</span>
            Closing Soon — Don&apos;t Miss These
          </h2>
          <Link
            href="/opportunities?deadline=This+Week"
            className="text-[#00E5FF] text-sm font-medium hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((opp) => (
            <div key={opp.id} className="relative border-l-4 border-[#F59E0B] rounded-xl overflow-hidden">
              <OpportunityCard opportunity={opp} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
