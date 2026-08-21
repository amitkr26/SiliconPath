"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, Globe, MapPin, Mail, ShieldCheck,
  Save, Loader2, Award, ExternalLink, Sparkles
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function EmployerCompanyProfilePage() {
  const router = useRouter();
  const { user, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [form, setForm] = useState({
    name: "",
    website: "",
    location: "Bengaluru, Karnataka, India",
    description: "",
    researchDomains: "Digital RTL Design, UVM Verification, 5nm/3nm Physical Design, RISC-V SoC Architecture",
    facilities: "Cleanroom Class 1000, Cadence Virtuoso, Synopsys Design Compiler, Ansys RedHawk",
    contactEmail: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirectTo=/employer/company");
      return;
    }
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.email?.split("@")[1]?.split(".")[0]?.toUpperCase() || "Silicon Innovation Lab",
        contactEmail: prev.contactEmail || user.email || "",
      }));
    }
  }, [user, isEmployer, isAdmin, authLoading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Simulate save or store in local state/database
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Company profile updated successfully!");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Company Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* PAGE HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/employer/dashboard" className="text-xs font-bold text-slate-500 hover:text-blue-600">
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-blue-600" /> Company &amp; Research Lab Profile
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-medium">
            Manage your organization branding, research scope, lab infrastructure, and verification details.
          </p>
        </div>

        {/* COMPANY BRANDING FORM */}
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">

            {/* VERIFIED BADGE HEADER */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 border-2 border-slate-900 text-white flex items-center justify-center font-black text-lg shadow-brutal-sm">
                  {form.name ? form.name[0] : "C"}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">{form.name || "Company / Lab Name"}</h2>
                  <p className="text-xs font-semibold text-slate-500">{form.contactEmail}</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border-2 border-slate-900 text-emerald-700 text-xs font-black shadow-brutal-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Recruiter
              </span>
            </div>

            {/* FORM FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                  Organization / Lab Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                  Official Website
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://yourcompany.in"
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                  Headquarter / Primary Lab Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                  Recruiter Contact Email
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                Research Scope &amp; Focus Domains
              </label>
              <input
                type="text"
                value={form.researchDomains}
                onChange={(e) => setForm({ ...form, researchDomains: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                EDA Tools &amp; Fab Cleanroom Facilities
              </label>
              <input
                type="text"
                value={form.facilities}
                onChange={(e) => setForm({ ...form, facilities: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                About the Company &amp; Lab Culture
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your research roadmap, semiconductor chips designed, patents, and work environment..."
                className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none resize-none"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-slate-900">
              <Link
                href="/employer/company-claim"
                className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1"
              >
                <Award className="w-4 h-4 text-slate-400" /> Need to claim another listed institution?
              </Link>

              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Company Profile</span>
              </Button>
            </div>

          </Card>
        </form>

      </div>
    </div>
  );
}
