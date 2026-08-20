"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Building2, Trash2, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", website: "", industry: "", location: "", size: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ companies?: any[] }>("/api/admin/companies");
      setCompanies(data?.companies || []);
    } catch {
      setCompanies([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/admin/companies", form);
      toast.success("Company created");
      setShowForm(false);
      setForm({ name: "", description: "", website: "", industry: "", location: "", size: "" });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create company");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this company?")) return;
    try {
      await api.delete(`/api/admin/companies/${id}`);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Companies</h1>
            <p className="text-slate-400 text-sm">Manage company profiles</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600/10 text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-600/20 border border-blue-500/30">
          <Plus className="w-4 h-4" /> Add Company
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Industry</label>
              <input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Website</label>
              <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Location</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Size</label>
              <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <option value="">Select size</option>
                <option value="1-10">1-10</option><option value="11-50">11-50</option>
                <option value="51-200">51-200</option><option value="201-1000">201-1000</option>
                <option value="1000+">1000+</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-24" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
              {saving ? "Creating..." : "Create Company"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 rounded-lg text-sm transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {companies.map(c => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <span className="font-bold text-blue-400 text-sm">{getInitials(c.name)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-100 font-medium text-sm">{c.name}</span>
                    {c.industry && <span className="text-slate-400 text-xs">{c.industry}</span>}
                  </div>
                  <div className="text-slate-400 text-xs">{c.location || ""} {c.follower_count ? `· ${c.follower_count} followers` : ""}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/companies/${c.slug || c.id}`} target="_blank" className="p-2 text-slate-400 hover:text-blue-400">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {companies.length === 0 && <p className="text-center py-12 text-slate-400">No companies yet</p>}
        </div>
      )}
    </div>
  );
}
