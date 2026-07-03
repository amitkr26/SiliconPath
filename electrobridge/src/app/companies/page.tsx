"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Building2, Users, MapPin, Globe } from "lucide-react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id);
    });
  }, [supabase]);

  const loadCompanies = async () => {
    setLoading(true);
    const res = await fetch(`/api/companies${search ? `?q=${search}` : ""}`);
    const data = await res.json();
    setCompanies(data.companies || []);
    setLoading(false);
  };

  useEffect(() => { loadCompanies(); }, [search]);

  const handleFollow = async (companyId: string, isFollowing: boolean) => {
    if (!currentUserId) { toast.error("Login required"); return; }
    if (isFollowing) {
      await fetch(`/api/companies/${companyId}/follow`, { method: "DELETE" });
      toast.success("Unfollowed");
    } else {
      await fetch(`/api/companies/${companyId}/follow`, { method: "POST" });
      toast.success("Following company!");
    }
    loadCompanies();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-text-primary">Companies</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="w-full bg-surface border border-border text-text-primary text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-accent focus:border-accent outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <div key={c.id} className="bg-surface border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <Link href={`/companies/${c.slug || c.id}`} className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-accent">{getInitials(c.name)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-text-primary font-semibold truncate">{c.name}</h3>
                  {c.industry && (
                    <p className="text-text-muted text-xs flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" /> {c.industry}
                    </p>
                  )}
                  {c.location && (
                    <p className="text-text-muted text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {c.location}
                    </p>
                  )}
                </div>
              </Link>

              {c.description && (
                <p className="text-text-secondary text-xs mt-3 line-clamp-2">{c.description}</p>
              )}

              <div className="flex items-center justify-between mt-4">
                <span className="text-text-muted text-xs flex items-center gap-1">
                  <Users className="w-3 h-3" /> {c.follower_count || 0} followers
                </span>
                <button
                  onClick={(e) => { e.preventDefault(); handleFollow(c.id, c.is_following); }}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border ${
                    c.is_following
                      ? "bg-surface border-border text-text-secondary"
                      : "bg-accent/20 border-accent/30 text-accent hover:bg-accent/30"
                  }`}
                >
                  {c.is_following ? "Following" : "Follow"}
                </button>
              </div>
            </div>
          ))}
          {companies.length === 0 && (
            <div className="col-span-full text-center py-12 text-text-secondary">
              {search ? "No companies found" : "No companies yet"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
