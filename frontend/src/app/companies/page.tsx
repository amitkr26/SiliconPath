"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Building2, Users, MapPin, Globe } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { FEATURES } from "@/lib/feature-flags";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { user } = useUser();

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    const data = await api.get<{ companies: any[] }>(
      "/api/companies",
      search ? { params: { q: search } } : undefined
    );
    setCompanies(data.companies || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  const handleFollow = async (companyId: string, isFollowing: boolean) => {
    if (!user) { toast.error("Login required"); return; }
    if (isFollowing) {
      await api.delete(`/api/companies/${companyId}/follow`);
      toast.success("Unfollowed");
    } else {
      await api.post(`/api/companies/${companyId}/follow`);
      toast.success("Following company!");
    }
    loadCompanies();
  };

  if (!FEATURES.LINKEDIN_ENABLED) {
    return (
      <ComingSoon
        feature="Company Directory"
        description="Follow top VLSI companies, government research labs, and universities to track their hiring updates."
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-black text-slate-900 tracking-tight">Companies</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <Card key={c.id} hover className="p-5">
              <Link href={`/companies/${c.slug || c.id}`} className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-50 border-2 border-slate-900 flex items-center justify-center flex-shrink-0 shadow-brutal-sm">
                  <span className="text-lg font-black text-blue-700">{getInitials(c.name)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-slate-900 font-bold truncate">{c.name}</h3>
                  {c.industry && (
                    <p className="text-slate-500 text-xs font-medium flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" /> {c.industry}
                    </p>
                  )}
                  {c.location && (
                    <p className="text-slate-500 text-xs font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {c.location}
                    </p>
                  )}
                </div>
              </Link>

              {c.description && (
                <p className="text-slate-600 text-xs font-medium mt-3 line-clamp-2">{c.description}</p>
              )}

              <div className="flex items-center justify-between mt-4">
                <span className="text-slate-500 text-xs font-medium flex items-center gap-1">
                  <Users className="w-3 h-3" /> {c.follower_count || 0} followers
                </span>
                <button
                  onClick={(e) => { e.preventDefault(); handleFollow(c.id, c.is_following); }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all border-2 border-slate-900 shadow-brutal-sm ${
                    c.is_following
                      ? "bg-white text-slate-700 hover:bg-slate-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {c.is_following ? "Following" : "Follow"}
                </button>
              </div>
            </Card>
          ))}
          {companies.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-700 font-semibold">
              {search ? "No companies found" : "No companies yet"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
