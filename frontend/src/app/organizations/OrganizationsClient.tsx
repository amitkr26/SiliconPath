"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, ArrowRight, Building2, Sparkles, Filter } from "lucide-react";

export interface OrgItem {
  name: string;
  slug: string;
  type?: string;
  location?: string;
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
        matchesCat = /defence|space|drdo|isro|bel|hal/i.test(`${org.type} ${org.name}`);
      } else if (selectedCategory === "Premier Academic Institution") {
        matchesCat = /iit|iisc|nit|academic|university/i.test(`${org.type} ${org.name}`);
      } else if (selectedCategory === "Semiconductor IDM & Fabless") {
        matchesCat = /semiconductor|fabless|idm|intel|qualcomm|arm|amd|tsmc|nvidia|texas/i.test(`${org.type} ${org.name}`);
      } else if (selectedCategory === "National Research Institute") {
        matchesCat = /csir|research|institute|lab|cense/i.test(`${org.type} ${org.name}`);
      }

      return matchesSearch && matchesCat;
    });
  }, [initialOrganizations, search, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_0px_#0F172A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, type, or city (e.g. ISRO, DRDO, IIT, Bengaluru, Qualcomm)..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-[2px_2px_0px_0px_#0F172A]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-black border-2 border-slate-900 transition-all ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-[2px_2px_0px_0px_#0F172A]"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* COUNT SUMMARY */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
          Showing {filtered.length} verified organizations
        </span>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* ORGANIZATIONS GRID */}
      {filtered.length === 0 ? (
        <div className="bg-white border-3 border-slate-900 rounded-2xl p-12 text-center shadow-[4px_4px_0px_0px_#0F172A]">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-900">No organizations found</h3>
          <p className="text-slate-600 text-xs mt-1">Try adjusting your search keywords or filter category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((org) => (
            <Link
              key={org.slug}
              href={`/opportunities?search=${encodeURIComponent(org.name)}`}
              className="bg-white border-3 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_0px_#0F172A] hover:shadow-[7px_7px_0px_0px_#0F172A] hover:-translate-y-1 transition-all duration-300 group block flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border-2 border-slate-900 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-[2px_2px_0px_0px_#0F172A]">
                    <span className="text-blue-600 font-black text-sm group-hover:text-white transition-colors">
                      {org.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-900 font-black text-base group-hover:text-blue-600 transition-colors truncate">
                      {org.name}
                    </h3>
                    {org.type && (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-bold mt-1">
                        {org.type}
                      </span>
                    )}
                    {org.location && (
                      <p className="text-slate-500 text-xs mt-2 flex items-center gap-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{org.location}</span>
                      </p>
                    )}
                  </div>
                </div>

                {org.description && (
                  <p className="text-slate-600 text-xs leading-relaxed mt-4 line-clamp-2 font-medium">
                    {org.description}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t-2 border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  {org.count} Openings
                </span>
                <span className="text-xs font-black text-slate-900 group-hover:text-blue-600 flex items-center gap-1">
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
