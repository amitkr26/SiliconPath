"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Building2, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
      const res = await fetch("/api/admin/companies");
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch { setCompanies([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Company created");
        setShowForm(false);
        setForm({ name: "", description: "", website: "", industry: "", location: "", size: "" });
        load();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed");
      }
    } catch { toast.error("Something went wrong"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this company?")) return;
    try {
      await fetch(`/api/admin/companies/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      load();
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-accent" />
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Companies</h1>
            <p className="text-text-muted text-sm">Manage company profiles</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-4 py-2 bg-accent/20 text-accent rounded-lg text-sm font-medium hover:bg-accent/30 border border-accent/30">
          <Plus className="w-4 h-4" /> Add Company
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-border rounded-xl p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Industry</label>
              <input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Website</label>
              <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Location</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Size</label>
              <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent">
                <option value="">Select size</option>
                <option value="1-10">1-10</option><option value="11-50">11-50</option>
                <option value="51-200">51-200</option><option value="201-1000">201-1000</option>
                <option value="1000+">1000+</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent h-24" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-accent text-navy rounded-lg text-sm font-medium hover:bg-accent-hover disabled:opacity-50">
              {saving ? "Creating..." : "Create Company"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-surface border border-border text-text-secondary rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {companies.map(c => (
            <div key={c.id} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <span className="font-bold text-accent text-sm">{getInitials(c.name)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary font-medium text-sm">{c.name}</span>
                    {c.industry && <span className="text-text-muted text-xs">{c.industry}</span>}
                  </div>
                  <div className="text-text-muted text-xs">{c.location || ""} {c.follower_count ? `· ${c.follower_count} followers` : ""}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/companies/${c.slug || c.id}`} target="_blank" className="p-2 text-text-muted hover:text-accent">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => handleDelete(c.id)} className="p-2 text-text-muted hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {companies.length === 0 && <p className="text-center py-12 text-text-secondary">No companies yet</p>}
        </div>
      )}
    </div>
  );
}
