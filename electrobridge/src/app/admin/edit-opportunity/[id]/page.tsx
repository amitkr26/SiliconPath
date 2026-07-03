"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, supabaseAdmin, isConfigured, isAdminConfigured } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, Save, Trash2, ArrowLeft } from "lucide-react";
import type { Opportunity } from "@/types";
import Link from "next/link";

export default function EditOpportunityPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (!adminPassword) {
      setAuthError("Admin password not configured");
      return;
    }
    if (password === adminPassword) {
      setAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Invalid password");
    }
  };

  useEffect(() => {
    if (!authenticated || !id) return;
    (async () => {
      setLoading(true);
      if (!isConfigured || !isAdminConfigured) {
        toast.error("Database not configured");
        setLoading(false);
        return;
      }
      const { data, error } = await supabaseAdmin!
        .from("opportunities")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast.error("Opportunity not found");
        router.push("/admin");
        return;
      }
      const opp = data as Opportunity;
      setForm({
        title: opp.title || "",
        organization: opp.organization || "",
        category: opp.category || "JRF",
        location: opp.location || "",
        stipend: opp.stipend || "",
        deadline: opp.deadline ? opp.deadline.slice(0, 10) : "",
        description: opp.description || "",
        apply_link: opp.apply_link || "",
        official_page_url: opp.official_page_url || "",
        tags: (opp.tags || []).join(", "),
      });
      setLoading(false);
    })();
  }, [authenticated, id, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        }),
      });
      if (res.ok) {
        toast.success("Opportunity updated!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    setDeleting(true);
    try {
      if (!isAdminConfigured) { toast.error("Admin access not configured"); return; }
      const { error } = await supabaseAdmin!
        .from("opportunities")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
      toast.success("Opportunity deactivated");
      router.push("/admin");
    } catch {
      toast.error("Failed to deactivate");
    }
    setDeleting(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl font-bold text-text-primary">Edit Opportunity</h1>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
          </div>
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1">Organization</label>
            <input required value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1">Category</label>
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
            <input value={form.apply_link} onChange={(e) => setForm({ ...form, apply_link: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
          </div>
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1">Official Page URL</label>
            <input value={form.official_page_url} onChange={(e) => setForm({ ...form, official_page_url: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-text-muted text-xs font-medium mb-1">Tags (comma-separated)</label>
          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="VLSI, thin film, JRF" className="w-full bg-gray-800 border border-gray-700 text-text-primary text-sm rounded-lg px-3 py-2.5 focus:ring-cyan focus:border-cyan outline-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-cyan text-navy font-semibold rounded-lg px-6 py-2.5 text-sm hover:bg-cyan/90 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
          <Link href="/admin" className="border border-gray-700 text-text-muted font-medium rounded-lg px-6 py-2.5 text-sm hover:border-gray-600 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
