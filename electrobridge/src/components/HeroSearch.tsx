"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/opportunities?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl mx-auto">
      <div className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2.5">
        <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search JRF, PhD, internships..."
          className="flex-1 bg-transparent text-text-primary text-sm outline-none placeholder:text-text-muted/50"
        />
        <button
          type="submit"
          className="bg-accent text-bg-primary rounded-full px-4 py-1.5 text-xs font-semibold hover:bg-accent-hover transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}
