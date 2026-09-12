"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, ArrowRight, Building2, Sparkles, Filter, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

export interface OrgItem {
  name: string;
  slug: string;
  type?: string;
  location?: string;
  website?: string | null;
  logo_url?: string | null;
  description?: string;
  count: number;
}

interface Props {
  initialOrganizations: OrgItem[];
}

const CATEGORIES = [
  "All",
  "Government Defence & Space",
  "Premier Academic Institution",
  "Semiconductor IDM & Fabless",
  "National Research Institute",
];

export default function OrganizationsClient({ initialOrganizations }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filtered = useMemo(() => {
    return initialOrganizations.filter((org) => {
      const matchesSearch =
        !search ||
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        (org.type && org.type.toLowerCase().includes(search.toLowerCase())) ||
        (org.location && org.location.toLowerCase().includes(search.toLowerCase())) ||
        (org.description && org.description.toLowerCase().includes(search.toLowerCase()));

      let matchesCat = true;
      if (selectedCategory === "Government Defence & Space") {
        matchesCat =
          org.type?.toLowerCase().includes("defence") ||
          org.type?.toLowerCase().includes("space") ||
          org.type?.toLowerCase().includes("government") ||
          org.name.toLowerCase().includes("isro") ||
          org.name.toLowerCase().includes("drdo") ||
          org.name.toLowerCase().includes("bel") ||
          org.name.toLowerCase().includes("cdac");
      } else if (selectedCategory === "Premier Academic Institution") {
        matchesCat =
          org.type?.toLowerCase().includes("academic") ||
          org.type?.toLowerCase().includes("university") ||
          org.name.toLowerCase().includes("iit") ||
          org.name.toLowerCase().includes("iisc") ||
          org.name.toLowerCase().includes("iiit") ||
          org.name.toLowerCase().includes("nit");
      } else if (selectedCategory === "Semiconductor IDM & Fabless") {
        matchesCat =
          org.type?.toLowerCase().includes("semiconductor") ||
          org.type?.toLowerCase().includes("fabless") ||
          org.type?.toLowerCase().includes("idm") ||
          org.name.toLowerCase().includes("intel") ||
          org.name.toLowerCase().includes("qualcomm") ||
          org.name.toLowerCase().includes("amd") ||
          org.name.toLowerCase().includes("arm") ||
          org.name.toLowerCase().includes("micron") ||
          org.name.toLowerCase().includes("nvidia") ||
          org.name.toLowerCase().includes("texas");
      } else if (selectedCategory === "National Research Institute") {
        matchesCat =
          org.type?.toLowerCase().includes("research") ||
          org.type?.toLowerCase().includes("institute") ||
          org.name.toLowerCase().includes("csir") ||
          org.name.toLowerCase().includes("tifr") ||
          org.name.toLowerCase().includes("iisc");
      }

      return matchesSearch && matchesCat;
    });
  }, [initialOrganizations, search, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* SEARCH AND FILTER BAR */}
      <Card className="p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, type, or city (e.g. ISRO, DRDO, IIT, Bengaluru, Qualcomm)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* COUNT SUMMARY */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Showing {filtered.length} verified organizations
        </span>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* ORGANIZATIONS GRID */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center border border-slate-200 shadow-xs">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No organizations found</h3>
          <p className="text-slate-600 text-xs mt-1">Try adjusting your search keywords or filter category.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((org) => (
            <Link
              key={org.slug}
              href={`/opportunities?search=${encodeURIComponent(org.name)}`}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 group block flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-100 bg-white">
                    <ImageWithFallback
                      src={org.logo_url}
                      alt={`${org.name} logo`}
                      name={org.name}
                      variant="logo"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-lg object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-900 font-bold text-sm sm:text-base group-hover:text-blue-600 transition-colors truncate">
                      {org.name}
                    </h3>
                    {org.type && (
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-medium mt-1">
                        {org.type}
                      </span>
                    )}
                    {org.location && (
                      <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{org.location}</span>
                      </p>
                    )}
                  </div>
                </div>

                {org.description && (
                  <p className="text-slate-600 text-xs leading-relaxed mt-3 line-clamp-2 font-normal">
                    {org.description}
                  </p>
                )}
              </div>

              <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <Badge tone="accent">
                  {org.count} Openings
                </Badge>
                <span className="font-semibold text-slate-900 group-hover:text-blue-600 flex items-center gap-1">
                  View Jobs <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
