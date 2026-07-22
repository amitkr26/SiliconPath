"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search, MapPin, Briefcase, Check, ExternalLink } from "lucide-react";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

export default function TalentPoolPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      let query = `/api/people/search?limit=50`;
      if (search) query += `&q=${search}`;
      const res = await fetch(query);
      if (res.ok) {
        const data = await res.json();
        setCandidates((data.people || []).filter((p: any) => p.is_open_to_work));
      }
      setLoading(false);
    };
    load();
  }, [search]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Briefcase className="w-6 h-6 text-accent" />
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Talent Pool</h1>
          <p className="text-text-muted text-sm">Candidates who are open to work</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, skills, or organization..."
          className="w-full bg-surface border border-border text-text-primary text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {candidates.map((p: any) => (
            <div key={p.id} className="bg-surface border border-border rounded-xl p-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-accent">{getInitials(p.full_name || "")}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/people/${p.username || p.id}`} className="text-text-primary font-medium hover:text-accent truncate">
                    {p.full_name}
                  </Link>
                  <span className="bg-success/20 text-success text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Open to {p.open_to_work_types?.join(", ") || "work"}
                  </span>
                </div>
                {p.headline && <p className="text-text-muted text-xs">{p.headline}</p>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-text-secondary">
                  {p.current_org && <span>{p.current_org}</span>}
                  {p.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city}</span>}
                </div>
                {p.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.skills.slice(0, 6).map((s: string) => (
                      <span key={s} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <Link
                href={`/people/${p.username || p.id}`}
                className="flex items-center gap-1 text-accent text-xs font-medium hover:underline flex-shrink-0"
              >
                View <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          ))}
          {candidates.length === 0 && (
            <div className="text-center py-16 text-text-secondary">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No open-to-work candidates found</p>
              <p className="text-sm mt-1">Users who enable &ldquo;Open to Work&rdquo; on their profile will appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
