"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

const ADMIN_TOKEN_KEY = "sp_admin_token";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 80)
    .replace(/-+$/, "");
}

export default function AddNewsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [authed, setAuthed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    source_name: "",
    source_url: "",
    category: "Semiconductor",
    tags: "",
    image_url: "",
    published_at: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const pw = sessionStorage.getItem("admin_password");
    if (!token && !pw) {
      router.push("/admin");
      return;
    }
    setAuthed(true);
  }, [router]);

  if (!authed) return (
    <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
    </div>
  );

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug === slugify(prev.title) || !prev.slug ? slugify(title) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/admin/news", {
        title: form.title,
        slug: form.slug || slugify(form.title),
        description: form.description,
        source_name: form.source_name,
        source_url: form.source_url,
        category: form.category,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        image_url: form.image_url || null,
        published_at: new Date(form.published_at).toISOString(),
      });
      toast.success("News article added!");
      setForm({
        title: "",
        slug: "",
        description: "",
        source_name: "",
        source_url: "",
        category: "Semiconductor",
        tags: "",
        image_url: "",
        published_at: new Date().toISOString().slice(0, 16),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add article");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-white">Add News Article</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-400 text-xs font-semibold mb-1">Title *</label>
          <input required value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-slate-400 text-xs font-semibold mb-1">Slug</label>
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-xs" />
          <p className="text-slate-500 text-[10px] mt-1">Auto-generated from title. Edit if needed.</p>
        </div>
        <div>
          <label className="block text-slate-400 text-xs font-semibold mb-1">Description *</label>
          <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Source Name</label>
            <input value={form.source_name} onChange={(e) => setForm({ ...form, source_name: e.target.value })} placeholder="IEEE Spectrum" className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <option>Semiconductor</option>
              <option>VLSI</option>
              <option>Embedded</option>
              <option>Research</option>
              <option>Policy</option>
              <option>Industry</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Source URL</label>
            <input type="url" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Image URL</label>
            <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Tags (comma-separated)</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="2nm, TSMC, semiconductor" className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1">Published At</label>
            <input type="datetime-local" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Article
          </button>
          <Link href="/admin" className="border border-slate-700 text-slate-300 font-medium rounded-lg px-6 py-2.5 text-sm hover:border-slate-500 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
