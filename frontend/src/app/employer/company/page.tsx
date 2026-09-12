"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, Globe, MapPin, Mail, ShieldCheck, ShieldAlert,
  Save, Loader2, Award, Upload, Trash2, CheckCircle2
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

export default function EmployerCompanyProfilePage() {
  const router = useRouter();
  const { user, username, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [form, setForm] = useState({
    name: "",
    website: "",
    logo_url: "",
    location: "Bengaluru, Karnataka, India",
    description: "",
    researchDomains: "Digital RTL Design, UVM Verification, 5nm/3nm Physical Design, RISC-V SoC Architecture",
    facilities: "Cleanroom Class 1000, Cadence Virtuoso, Synopsys Design Compiler, Ansys RedHawk",
    contactEmail: "",
  });
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirectTo=/employer/company");
      return;
    }
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isEmployer, isAdmin, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function loadCompanyData() {
      try {
        setLoading(true);
        const res = await fetch("/api/employer/company");
        const data = await res.json();
        if (data.company) {
          setForm({
            name: data.company.name || "",
            website: data.company.website || "",
            logo_url: data.company.logo_url || data.company.organization?.logo_url || "",
            location: data.company.headquarters || data.company.location || "Bengaluru, Karnataka, India",
            description: data.company.description || "",
            researchDomains: (data.company.specialties || []).join(", ") || "Digital RTL Design, UVM Verification, Physical Design",
            facilities: "Cleanroom Class 1000, Cadence Virtuoso, Synopsys Design Compiler, Ansys RedHawk",
            contactEmail: user?.email || "",
          });
          setIsVerified(Boolean(data.company.is_verified || data.company.organization?.is_verified));
        }
      } catch {
        // Keep initial defaults
      } finally {
        setLoading(false);
      }
    }
    loadCompanyData();
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo file must be less than 2MB");
      return;
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/employer/company/logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload logo");

      setForm((prev) => ({ ...prev, logo_url: data.logo_url }));
      toast.success("Logo uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/employer/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      toast.success("Company profile saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Company Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* PAGE HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/employer/dashboard" className="text-xs font-medium text-slate-500 hover:text-blue-600">
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-blue-600" /> Company &amp; Research Lab Profile
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Manage your organization branding, logo, research scope, lab infrastructure, and verification details.
          </p>
        </div>

        {/* COMPANY BRANDING FORM */}
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="p-6 sm:p-8 bg-white border border-slate-200 rounded-xl shadow-xs space-y-6">

            {/* BRANDING PREVIEW & VERIFICATION BANNER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <ImageWithFallback
                    src={form.logo_url}
                    alt={`${form.name || "Company"} logo`}
                    name={form.name || "Company"}
                    variant="monogram"
                    size={64}
                    className="w-16 h-16 rounded-xl border border-slate-200 shadow-xs flex-shrink-0"
                  />
                  {form.logo_url && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, logo_url: "" }))}
                      aria-label="Remove logo"
                      className="absolute -top-2 -right-2 p-1 bg-white border border-slate-300 rounded-full text-slate-500 hover:text-red-600 shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{form.name || "Organization Name"}</h2>
                    {username && (
                      <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        @{username}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{form.contactEmail}</p>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-1">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Organization
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                    <ShieldAlert className="w-4 h-4 text-amber-600" /> Unverified Profile
                  </span>
                )}
                <span className="text-[11px] text-slate-400">
                  {isVerified ? "Officially vetted" : "Branding only • Verification requires claim"}
                </span>
              </div>
            </div>

            {/* LOGO UPLOAD SECTION */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Official Organization Logo
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload PNG, JPG or WebP (max 2MB). A deterministic monogram will be generated if omitted.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={uploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                    )}
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Or enter public logo URL
                </label>
                <input
                  type="url"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="https://example.org/brand/logo.png"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-normal text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            {/* FORM FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Organization / Lab Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Official Website
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://yourcompany.in"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Headquarter / Primary Lab Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Recruiter Contact Email
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Research Scope &amp; Focus Domains
              </label>
              <input
                type="text"
                value={form.researchDomains}
                onChange={(e) => setForm({ ...form, researchDomains: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                EDA Tools &amp; Fab Cleanroom Facilities
              </label>
              <input
                type="text"
                value={form.facilities}
                onChange={(e) => setForm({ ...form, facilities: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                About the Company &amp; Lab Culture
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your research roadmap, semiconductor chips designed, patents, and work environment..."
                className="w-full p-3.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-normal text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 resize-none"
              />
            </div>

            {/* SUBMIT BUTTON & CLAIM LINK */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t border-slate-200 gap-4">
              <Link
                href="/employer/company-claim"
                className="text-xs font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1.5"
              >
                <Award className="w-4 h-4 text-slate-400" /> Need official verification for another listed institution?
              </Link>

              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                <span>Save Company Profile</span>
              </Button>
            </div>

          </Card>
        </form>

      </div>
    </div>
  );
}
