"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Megaphone } from "lucide-react";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_by: string;
  created_at: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/admin/announcements")
      .then(r => r.json())
      .then(d => { setAnnouncements(d.announcements || []); setLoading(false); })
      .catch(() => { setLoading(false); toast.error("Failed to load announcements"); });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    if (!res.ok) { toast.error("Failed to create"); return; }
    const created = await res.json();
    setAnnouncements(prev => [created, ...prev]);
    setTitle(""); setBody(""); setShowForm(false);
    toast.success("Announcement created");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const res = await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    toast.success("Announcement deleted");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Megaphone className="w-6 h-6 text-accent" />
          <h1 className="font-display text-2xl font-bold text-text-primary">Announcements</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-accent text-navy px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> {showForm ? "Cancel" : "New"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-border rounded-xl p-4 mb-6">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
            className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-text-primary mb-2" required />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Body"
            className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-text-primary min-h-[100px] mb-3" required />
          <button type="submit" className="bg-accent text-navy px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90">
            Publish
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-xl">
          <Megaphone className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="text-text-secondary">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-text-primary font-medium">{a.title}</h3>
                  <p className="text-text-secondary text-sm mt-1 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-text-muted text-xs mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleDelete(a.id)}
                  className="text-text-muted hover:text-danger p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
