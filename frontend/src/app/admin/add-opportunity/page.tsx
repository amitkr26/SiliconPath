"use client";

import { useState, useEffect } from "react";
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
        if (data.token) localStorage.setItem("admin_token", data.token);
        setAuthenticated(true);
      } else {
        setAuthError(data.error || "Invalid password");
      }
    } catch {
      setAuthError("Authentication request failed");
    }
  };

  useEffect(() => {
    const existingToken = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    const existingPw = typeof window !== "undefined" ? sessionStorage.getItem("admin_password") : null;
    if (!existingToken && !existingPw) return;

    fetch("/api/admin/auth/session", {
      method: "POST",
      headers: {
        ...(existingToken ? { Authorization: `Bearer ${existingToken}` } : {}),
        ...(existingPw ? { "x-admin-password": existingPw } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setAuthenticated(true);
        else if (existingPw) setAuthenticated(true);
      })
      .catch(() => {
        if (existingPw) setAuthenticated(true);
      });
  }, []);

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
        verification_status: "pending",
        is_active: true,
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
        <h1 className="font-display text-2xl font-bold text-white text-center mb-6">Admin Login</h1>
        <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1.5">Admin Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          {authError && <p className="text-red-400 text-sm">{authError}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-white">Add New Opportunity</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Organization *</label>
            <input required value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Category *</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              {CATEGORIES.filter((c) => c !== "All").map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Stipend</label>
            <input value={form.stipend} onChange={(e) => setForm({ ...form, stipend: e.target.value })} placeholder="₹37,000/month" className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Deadline</label>
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-slate-400 text-xs font-semibold mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Apply Link</label>
            <input type="url" value={form.apply_link} onChange={(e) => setForm({ ...form, apply_link: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Official Page URL</label>
            <input type="url" value={form.official_page_url} onChange={(e) => setForm({ ...form, official_page_url: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Tags (comma-separated)</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="VLSI, thin film, JRF" className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Verification Status</label>
            <select value={form.verification_status} onChange={(e) => setForm({ ...form, verification_status: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="link_unavailable">Link Unavailable</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Opportunity
          </button>
          <Link href="/admin" className="border border-slate-700 text-slate-300 font-medium rounded-lg px-6 py-2.5 text-sm hover:border-slate-500 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
