"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Building2, MapPin, Globe, Users, Calendar,
  ArrowLeft, ExternalLink
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { FEATURES } from "@/lib/feature-flags";
import { ComingSoon } from "@/components/shared/ComingSoon";

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function CompanyDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useUser();

  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const injectJsonLd = useCallback((data: any) => {
    const existing = document.getElementById("company-jsonld");
    if (existing) existing.remove();
    const existingBreadcrumb = document.getElementById("breadcrumb-jsonld");
    if (existingBreadcrumb) existingBreadcrumb.remove();

    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: data.name,
      description: data.description || `${data.name} — Company profile on BerojgarDegreeWala`,
      url: `https://berojgardegreewala.vercel.app/companies/${slug}`,
      ...(data.website ? { sameAs: [data.website] } : {}),
      ...(data.industry ? { industry: data.industry } : {}),
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://berojgardegreewala.vercel.app" },
        { "@type": "ListItem", position: 2, name: "Companies", item: "https://berojgardegreewala.vercel.app/companies" },
        { "@type": "ListItem", position: 3, name: data.name },
      ],
    };

    const script1 = document.createElement("script");
    script1.id = "company-jsonld";
    script1.type = "application/ld+json";
    script1.textContent = JSON.stringify(orgSchema);
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.id = "breadcrumb-jsonld";
    script2.type = "application/ld+json";
    script2.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(script2);
  }, [slug]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.get<any>(`/api/companies/${slug}`);
        setCompany(data);
        setIsFollowing(data.is_following || false);
        injectJsonLd(data);
      } catch { setCompany(null); }
      setLoading(false);
    };
    load();
  }, [slug, injectJsonLd]);

  const handleFollow = async () => {
    if (!user) { toast.error("Login required"); return; }
    if (isFollowing) {
      await api.delete(`/api/companies/${slug}/follow`);
      setIsFollowing(false);
      setCompany((prev: any) => ({ ...prev, follower_count: Math.max(0, (prev.follower_count || 0) - 1) }));
      toast.success("Unfollowed");
    } else {
      await api.post(`/api/companies/${slug}/follow`);
      setIsFollowing(true);
      setCompany((prev: any) => ({ ...prev, follower_count: (prev.follower_count || 0) + 1 }));
      toast.success("Following company!");
    }
  };

  if (!FEATURES.LINKEDIN_ENABLED) {
    return (
      <ComingSoon
        feature="Company Profile"
        description="Follow top VLSI companies, government research labs, and universities to track their hiring updates."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Building2 className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-2">Company not found</h2>
        <Link href="/companies" className="text-accent text-sm hover:underline">Back to companies</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/companies" className="inline-flex items-center gap-1 text-text-secondary text-sm hover:text-accent mb-6">
        <ArrowLeft className="w-4 h-4" /> All Companies
      </Link>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Banner */}
        <div className="h-32 sm:h-48 bg-gradient-to-r from-accent/30 to-accent/10" />

        {/* Company header */}
        <div className="px-6 pb-6">
          <div className="flex items-end -mt-12 mb-4">
            <div className="w-20 h-20 rounded-xl bg-accent/20 border-4 border-surface flex items-center justify-center">
              <span className="text-2xl font-bold text-accent">{getInitials(company.name)}</span>
            </div>
            <div className="ml-4 pb-1">
              <h1 className="text-2xl font-bold text-text-primary">{company.name}</h1>
              {company.industry && (
                <p className="text-text-secondary flex items-center gap-1 text-sm">
                  <Building2 className="w-4 h-4" /> {company.industry}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted mb-4">
            {company.location && (
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {company.location}</span>
            )}
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent hover:underline">
                <Globe className="w-4 h-4" /> Website <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {company.follower_count || 0} followers</span>
          </div>

          <button
            onClick={handleFollow}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors border ${
              isFollowing
                ? "bg-surface border-border text-text-secondary"
                : "bg-accent/20 border-accent/30 text-accent hover:bg-accent/30"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>
      </div>

      {/* About */}
      {company.description && (
        <div className="bg-surface border border-border rounded-xl p-6 mt-4">
          <h2 className="font-display text-lg font-bold text-text-primary mb-3">About</h2>
          <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">{company.description}</p>
        </div>
      )}
    </div>
  );
}
