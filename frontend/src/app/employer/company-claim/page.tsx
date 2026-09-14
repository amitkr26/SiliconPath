"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building, ArrowLeft, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";

export default function CompanyClaimPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organizationId: "",
    businessEmail: "",
    verificationDetails: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirectTo=/employer/company-claim");
      return;
    }
    const role = user?.user_metadata?.role;
    if (user && role !== "employer" && role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    // Load organizations for select box
    api.get<{ organizations: any[] }>("/api/organizations").then((res) => {
      setOrganizations(res.organizations || []);
      if (res.organizations && res.organizations.length > 0) {
        setFormData((prev) => ({ ...prev, organizationId: res.organizations[0].id }));
      }
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organizationId || !formData.businessEmail || !formData.verificationDetails) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/employer/claim", {
        organizationId: formData.organizationId,
        businessEmail: formData.businessEmail,
        verificationDetails: formData.verificationDetails,
      });
      toast.success("Company claim request submitted successfully! Admins will review it shortly.");
      router.push("/employer/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit claim request");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <Card className="p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2 mb-2">
            <Building className="w-6 h-6 text-accent" /> Claim Company Profile
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            Verify your employer relationship with an organization to manage its job listings, profile details, and applications.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              label="Select Organization *"
              value={formData.organizationId}
              onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </Select>

            <Input
              label="Business Email Address *"
              type="email"
              required
              value={formData.businessEmail}
              onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
              placeholder="e.g. hr@ceeri.res.in"
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Verification Details *</label>
              <textarea
                required
                value={formData.verificationDetails}
                onChange={(e) => setFormData({ ...formData, verificationDetails: e.target.value })}
                placeholder="Provide details proving your association, such as your position, employee ID, or verification code..."
                rows={4}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Claim Request"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
