"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import AdminNav from "../_components/AdminNav";

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_by?: string;
  created_at: string;
}

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    const pw = typeof window !== "undefined" ? sessionStorage.getItem("admin_password") : null;
    if (!token && !pw) {
      router.push("/admin");
      return;
    }
    setAuthed(true);
  }, [router]);

  useEffect(() => {
    if (!authed) return;
    api.get<{ announcements?: Announcement[] }>("/api/admin/announcements")
      .then((d) => { setAnnouncements(d?.announcements || []); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [authed]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.post<Announcement>("/api/admin/announcements", { title, body });
      setAnnouncements((prev) => [created, ...prev]);
      setTitle(""); setBody(""); setShowForm(false);
      toast.success("Announcement created");
    } catch {
      toast.error("Failed to create announcement");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await api.delete(`/api/admin/announcements?id=${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success("Announcement deleted");
    } catch {
      toast.error("Failed to delete announcement");
    }
  };

  if (!authed) return (
    <div className="max-w-5xl mx-auto px-4 py-20 flex justify-center">
      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminNav title="System Announcements" subtitle="Broadcast updates to all users" icon={Megaphone} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-amber-400" />
            <h1 className="font-display text-2xl font-bold text-white">Announcements</h1>
          </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> {showForm ? "Cancel" : "New"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Body"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 min-h-[100px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            Publish
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
          <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-slate-100 font-medium">{a.title}</h3>
                  <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-slate-500 text-xs mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleDelete(a.id)}
                  className="text-slate-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
