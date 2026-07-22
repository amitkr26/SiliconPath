"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Briefcase, Building2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

type AccountType = "seeker" | "provider";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("seeker");

  // shared
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");

  // seeker
  const [headline, setHeadline] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [skills, setSkills] = useState("");

  // provider
  const [orgName, setOrgName] = useState("");
  const [orgKind, setOrgKind] = useState("company");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const meta = user.user_metadata || {};
    const type: AccountType = meta.account_type === "provider" ? "provider" : "seeker";
    setAccountType(type);
    setDisplayName(meta.full_name || "");
    setOrgName(meta.org_name || "");
    setReady(true);
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await api.post("/api/profile", {
        id: user.id,
        email: user.email,
        account_type: accountType,
        display_name: displayName,
        location: location || null,
        country: country || null,
        headline: accountType === "seeker" ? headline || null : null,
        job_title: accountType === "seeker" ? jobTitle || null : null,
        skills:
          accountType === "seeker" && skills
            ? skills.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
      });

      if (accountType === "provider") {
        await api.post("/api/organizations", {
          owner_id: user.id,
          name: orgName,
          slug: slugify(orgName) + "-" + Date.now().toString(36),
          kind: orgKind,
          website: website || null,
          location: location || null,
          country: country || null,
        });
      }

      toast.success("Profile set up!");
      router.replace(accountType === "provider" ? "/dashboard" : "/feed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            {accountType === "provider" ? (
              <Building2 className="w-5 h-5 text-accent" />
            ) : (
              <Briefcase className="w-5 h-5 text-accent" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              {accountType === "provider" ? "Set up your organization" : "Set up your profile"}
            </h1>
            <p className="text-sm text-text-secondary">This takes less than a minute.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {accountType === "provider" ? "Your name" : "Full name"}
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
            />
          </div>

          {accountType === "seeker" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Headline</label>
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="VLSI Design Engineer | RTL & Verification"
                  className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-text-muted"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Current role</label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. M.Tech student, RTL Engineer"
                  className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-text-muted"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Skills (comma separated)</label>
                <input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Verilog, SystemVerilog, UVM, Physical Design"
                  className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-text-muted"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Organization name</label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Organization type</label>
                <select
                  value={orgKind}
                  onChange={(e) => setOrgKind(e.target.value)}
                  className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
                >
                  <option value="company">Company</option>
                  <option value="startup">Startup</option>
                  <option value="university">University</option>
                  <option value="institution">Institution</option>
                  <option value="government">Government</option>
                  <option value="research_lab">Research Lab</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Website</label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                  className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-text-muted"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bangalore"
                className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-text-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Country</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
                className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-text-muted"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving..." : "Finish setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
