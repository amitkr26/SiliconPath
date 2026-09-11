"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search, MapPin, Briefcase, Check, ExternalLink, ArrowLeft } from "lucide-react";

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
        <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Briefcase className="w-6 h-6 text-blue-400" />
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Talent Pool</h1>
          <p className="text-slate-400 text-sm">Candidates who are open to work</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, skills, or organization..."
          className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {candidates.map((p: any) => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-400">{getInitials(p.display_name || "")}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/people/${p.username || p.id}`} className="text-slate-100 font-medium hover:text-blue-400 truncate">
                    {p.display_name}
                  </Link>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Open to {p.open_to_work_types?.join(", ") || "work"}
                  </span>
                </div>
                {p.headline && <p className="text-slate-400 text-xs">{p.headline}</p>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-300">
                  {p.current_org && <span>{p.current_org}</span>}
                  {p.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city}</span>}
                </div>
                {p.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.skills.slice(0, 6).map((s: string) => (
                      <span key={s} className="text-[10px] bg-blue-600/10 text-blue-400 px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <Link
                href={`/people/${p.username || p.id}`}
                className="flex items-center gap-1 text-blue-400 text-xs font-medium hover:underline flex-shrink-0"
              >
                View <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          ))}
          {candidates.length === 0 && (
            <div className="text-center py-16 text-slate-400">
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
