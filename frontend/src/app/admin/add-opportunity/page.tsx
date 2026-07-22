"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { CATEGORIES } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, Plus, ArrowLeft } from "lucide-react";

export default function AddOpportunityPage() {
  const router = useRouter();
  const { user } = useUser();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    organization: "",
    category: "JRF",
    location: "",
    stipend: "",
    deadline: "",
    description: "",
    apply_link: "",
    official_page_url: "",
    tags: "",
    verification_status: "pending",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.authenticated) {
        sessionStorage.setItem("admin_password", password);
        setAuthenticated(true);
      } else {
        setAuthError(data.error || "Invalid password");
      }
    } catch {
      setAuthError("Authentication request failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/admin/opportunities", {
        title: form.title,
        organization: form.organization,
        category: form.category,
        location: form.location || null,
        stipend: form.stipend || null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        description: form.description || null,
        apply_link: form.apply_link || null,
        official_page_url: form.official_page_url || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        verification_status: form.verification_status,
        is_active: true,
        posted_at: new Date().toISOString(),
      });
      toast.success("Opportunity added!");
      setForm({ title: "", organization: "", category: "JRF", location: "", stipend: "", deadline: "", description: "", apply_link: "", official_page_url: "", tags: "", verification_status: "pending" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add opportunity");
    }
    setSaving(false);
  };

  if (!authenticated) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20">
        <h1 className="font-display text-2xl font-bold text-text-primary text-center mb-6">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-4 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
          {authError && <p className="text-red-400 text-sm">{authError}</p>}
          <button type="submit" className="w-full bg-cyan text-navy font-semibold rounded-lg py-2.5 text-sm">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-text-primary">Add New Opportunity</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1">Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
          </div>
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1">Organization *</label>
            <input required value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1">Category *</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none">
              {CATEGORIES.filter((c) => c !== "All").map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1">Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1">Stipend</label>
            <input value={form.stipend} onChange={(e) => setForm({ ...form, stipend: e.target.value })} placeholder="₹37,000/month" className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
          </div>
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1">Deadline</label>
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-text-muted text-xs font-medium mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1">Apply Link</label>
            <input type="url" value={form.apply_link} onChange={(e) => setForm({ ...form, apply_link: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
          </div>
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1">Official Page URL</label>
            <input type="url" value={form.official_page_url} onChange={(e) => setForm({ ...form, official_page_url: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1">Tags (comma-separated)</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="VLSI, thin film, JRF" className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
          </div>
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1">Verification Status</label>
            <select value={form.verification_status} onChange={(e) => setForm({ ...form, verification_status: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none">
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="link_unavailable">Link Unavailable</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-cyan text-navy font-semibold rounded-lg px-6 py-2.5 text-sm hover:bg-cyan/90 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Opportunity
          </button>
          <Link href="/admin" className="border border-gray-700 text-text-muted font-medium rounded-lg px-6 py-2.5 text-sm hover:border-gray-600 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
