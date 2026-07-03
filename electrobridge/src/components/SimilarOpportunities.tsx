import { supabaseAdmin } from "@/lib/supabase";
import type { Opportunity } from "@/types";
import OpportunityCard from "./OpportunityCard";

interface SimilarOpportunitiesProps {
  currentId: string;
  tags: string[];
}

async function getSimilar(id: string, tags: string[]): Promise<Opportunity[]> {
  if (!supabaseAdmin?.from || !tags.length) return [];
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabaseAdmin
    .from("opportunities")
    .select("*")
    .eq("is_active", true)
    .neq("id", id)
    .or(`deadline.gte.${today},deadline.is.null`)
    .overlaps("tags", tags)
    .order("created_at", { ascending: false })
    .limit(3);

  return (data as Opportunity[]) || [];
}

export default async function SimilarOpportunities({
  currentId,
  tags,
}: SimilarOpportunitiesProps) {
  const opportunities = await getSimilar(currentId, tags);

  if (opportunities.length === 0) return null;

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16">
      <h2 className="font-display text-xl font-bold text-text-primary mb-6">
        You might also like
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opportunities.map((opp) => (
          <OpportunityCard key={opp.id} opportunity={opp} />
        ))}
      </div>
    </section>
  );
}
