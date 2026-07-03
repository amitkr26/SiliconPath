"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Target, ExternalLink, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { CATEGORIES } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface MatchItem {
  id?: string;
  title: string;
  organization: string;
  category: string;
  location: string | null;
  stipend: string | null;
  deadline: string | null;
  eligibility: string | null;
  slug?: string;
  matchScore: number;
  matchReason: string;
}

export default function MatchPage() {
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hasNET, setHasNET] = useState(false);
  const [hasGATE, setHasGATE] = useState(false);
  const [location, setLocation] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();
        if (profile) {
          if (profile.qualification) setQualification(profile.qualification);
          if (profile.specialization) setSpecialization(profile.specialization);
          if (profile.has_net) setHasNET(true);
          if (profile.has_gate) setHasGATE(true);
          if (profile.preferred_location) setLocation(profile.preferred_location);
        }
      }
    });
  }, []);

  const toggleLooking = (cat: string) => {
    setLookingFor((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qualification,
          specialization,
          hasNET,
          hasGATE,
          preferredLocation: location,
          lookingFor: lookingFor.length > 0 ? lookingFor : ["JRF", "PhD"],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Match failed");
      }

      const data = await res.json();
      setMatches(data.matches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCats = CATEGORIES.filter((c) => c !== "All");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-3">
          <Target className="w-7 h-7 sm:w-8 sm:h-8 text-accent" />
          Find My Match
        </h1>
        <p className="text-text-secondary mt-2 text-sm">
          Tell us about your profile and we&apos;ll find the best opportunities for you using AI.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-text-secondary text-xs font-medium mb-1">Highest Qualification</label>
            <select
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              required
              className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
            >
              <option value="">Select...</option>
              <option value="MSc Electronics">MSc Electronics</option>
              <option value="MSc Physics">MSc Physics</option>
              <option value="BTech ECE">BTech ECE</option>
              <option value="BTech EE">BTech EE</option>
              <option value="MTech VLSI">MTech VLSI</option>
              <option value="MTech ECE">MTech ECE</option>
              <option value="PhD">PhD</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-text-secondary text-xs font-medium mb-1">Specialization</label>
            <input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="thin film, spintronics, VLSI, embedded..."
              className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasNET}
              onChange={(e) => setHasNET(e.target.checked)}
              className="accent-accent"
            />
            <span className="text-text-primary text-sm">NET Qualified</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasGATE}
              onChange={(e) => setHasGATE(e.target.checked)}
              className="accent-accent"
            />
            <span className="text-text-primary text-sm">GATE Qualified</span>
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-text-secondary text-xs font-medium mb-2">Looking For</label>
          <div className="flex flex-wrap gap-2">
            {filterCats.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleLooking(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  lookingFor.includes(cat)
                    ? "bg-accent text-bg-primary"
                    : "bg-bg-primary text-text-secondary border border-border hover:border-accent/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-text-secondary text-xs font-medium mb-1">Preferred Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Delhi, Bangalore, Hyderabad, International..."
            className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-accent text-bg-primary font-semibold rounded-lg px-6 py-2.5 text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Matching...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Find My Match</>
          )}
        </button>
      </form>

      {error && (
        <div className="bg-danger/15 border border-danger/30 rounded-lg p-4 mb-6">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      )}

      {searched && !loading && matches.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg">No matching opportunities found.</p>
          <p className="text-text-secondary text-sm mt-1">Try broadening your search criteria.</p>
        </div>
      )}

      {matches.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-4">
            Your Matches ({matches.length})
          </h2>
          <div className="space-y-4">
            {matches
              .sort((a, b) => b.matchScore - a.matchScore)
              .map((match, idx) => (
                <div
                  key={match.id || idx}
                  className="bg-surface border border-border rounded-lg p-4 hover:border-accent/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-text-primary font-semibold text-sm">
                          {match.title}
                        </h3>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            match.matchScore >= 80
                              ? "bg-success/20 text-success"
                              : match.matchScore >= 60
                                ? "bg-warning/20 text-warning"
                                : "bg-surface-elevated text-text-secondary"
                          }`}
                        >
                          {match.matchScore}%
                        </span>
                      </div>
                      <p className="text-text-secondary text-xs">
                        {match.organization} {match.stipend ? `• ${match.stipend}` : ""}
                      </p>
                      <p className="text-text-secondary text-xs mt-1">
                        <GraduationCap className="w-3 h-3 inline mr-1" />
                        {match.eligibility || "See details"}
                        {match.location && (
                          <>
                            {" "}• <MapPin className="w-3 h-3 inline mr-1" />
                            {match.location}
                          </>
                        )}
                      </p>
                      <p className="text-accent text-xs mt-2 italic">{match.matchReason}</p>
                    </div>
                    {match.slug && (
                      <Link
                        href={`/opportunities/${match.slug}`}
                        className="flex items-center gap-1 text-accent text-xs font-medium hover:underline flex-shrink-0"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
