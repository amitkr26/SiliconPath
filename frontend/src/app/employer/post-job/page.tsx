"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, ArrowLeft, Loader2, Plus, Sparkles,
  Building, MapPin, DollarSign, Calendar, CheckSquare, FileText, Send
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function PostJobPage() {
  const router = useRouter();
  const { user, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    organization: "",
    category: "JRF",
    location: "Bengaluru, Karnataka, India",
    stipend: "₹37,000/month (DST JRF Norms) + HRA",
    deadline: "",
    eligibility: "B.Tech/M.Tech in ECE/VLSI/Microelectronics with valid GATE score",
    description: "",
    apply_link: "",
    tagsInput: "SystemVerilog, UVM, RTL Design, ASIC",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirectTo=/employer/post-job");
      return;
    }
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
    if (user && !formData.organization) {
      const defaultOrg = user.email?.split("@")[1]?.split(".")[0]?.toUpperCase() || "Semiconductor Lab";
      setFormData((prev) => ({ ...prev, organization: defaultOrg }));
    }
  }, [user, isEmployer, isAdmin, authLoading, router, formData.organization]);

  const applyTemplate = (type: "jrf" | "srf" | "rtl" | "uvm" | "intern") => {
    if (type === "jrf") {
      setFormData((prev) => ({
        ...prev,
        title: "Junior Research Fellow (JRF) - VLSI Architecture",
        category: "JRF",
        stipend: "₹37,000/month + HRA (DST / CSIR Norms)",
        eligibility: "M.Tech / M.E. in VLSI / Microelectronics / ECE with valid GATE score",
        tagsInput: "JRF, VLSI, RTL, Verilog, FPGA, DST Fellowship",
      }));
    } else if (type === "srf") {
      setFormData((prev) => ({
        ...prev,
        title: "Senior Research Fellow (SRF) - RISC-V SoC Design",
        category: "SRF",
        stipend: "₹42,000/month + HRA (DST Norms)",
        eligibility: "M.Tech with 2 years research experience in RISC-V or ASIC",
        tagsInput: "SRF, RISC-V, SoC, Cadence, Synopsys",
      }));
    } else if (type === "rtl") {
      setFormData((prev) => ({
        ...prev,
        title: "Digital RTL Design Engineer",
        category: "government",
        stipend: "₹12,00,000 - ₹18,00,000 LPA",
        eligibility: "B.Tech/M.Tech in ECE/EE with 1-4 years RTL design experience",
        tagsInput: "SystemVerilog, RTL, Synthesis, STA, Primetime, ASIC",
      }));
    } else if (type === "uvm") {
      setFormData((prev) => ({
        ...prev,
        title: "ASIC Verification Engineer (UVM / SystemVerilog)",
        category: "government",
        stipend: "₹14,00,000 - ₹22,00,000 LPA",
        eligibility: "B.Tech/M.Tech with strong OOP SystemVerilog & UVM testbench skills",
        tagsInput: "UVM, SystemVerilog, Testbench, Coverage, SVA, Verification",
      }));
    } else if (type === "intern") {
      setFormData((prev) => ({
        ...prev,
        title: "VLSI Design & Physical Design Intern",
        category: "internship",
        stipend: "₹30,000 - ₹45,000/month",
        eligibility: "Pre-final / Final year B.Tech or M.Tech students in VLSI / ECE",
        tagsInput: "Internship, Physical Design, STA, Verilog, Cadence",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.organization) {
      toast.error("Please fill in the title and organization.");
      return;
    }

    try {
      setLoading(true);
      const tags = formData.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const jobData = {
        title: formData.title,
        organization: formData.organization,
        category: formData.category,
        location: formData.location || null,
        stipend: formData.stipend || null,
        deadline: formData.deadline || null,
        eligibility: formData.eligibility || null,
        description: formData.description || null,
        apply_link: formData.apply_link || null,
        tags,
      };

      await api.post("/api/employer/jobs", jobData);
      toast.success("Position posted successfully!");
      router.push("/employer/jobs");
    } catch (err: any) {
      toast.error(err.message || "Failed to post position");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Studio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* PAGE HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/employer/jobs" className="text-xs font-bold text-slate-500 hover:text-blue-600">
              ← Back to Job Postings
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Plus className="w-7 h-7 text-blue-600" /> Post New Position or Research Fellowship
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-medium">
            Publish government research fellowships (JRF/SRF), PhD research posts, or chip engineering openings to 10,000+ verified scholars.
          </p>
        </div>

        {/* QUICK TEMPLATE FILLER */}
        <div className="bg-white p-4 border-2 border-slate-900 rounded-2xl shadow-brutal-sm space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Quick-Fill Standard Semiconductor Templates:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyTemplate("jrf")}
              className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-600 text-blue-800 text-xs font-bold transition-all"
            >
              DST JRF Fellowship (₹37k/mo)
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("srf")}
              className="px-3 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-600 text-purple-800 text-xs font-bold transition-all"
            >
              SRF RISC-V Fellow (₹42k/mo)
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("rtl")}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-900 text-slate-900 text-xs font-bold transition-all"
            >
              Digital RTL Engineer
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("uvm")}
              className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-600 text-emerald-800 text-xs font-bold transition-all"
            >
              UVM Verification Lead
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("intern")}
              className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-600 text-amber-800 text-xs font-bold transition-all"
            >
              VLSI Semester Intern
            </button>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-5">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                  Job / Fellowship Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Junior Research Fellow (JRF) - Analog Mixed-Signal IC Design"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                  Organization / Lab Name *
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                >
                  <option value="JRF">Junior Research Fellow (JRF)</option>
                  <option value="SRF">Senior Research Fellow (SRF)</option>
                  <option value="PhD">PhD / Doctoral Fellowship</option>
                  <option value="government">Government / Industry VLSI Job</option>
                  <option value="internship">Semiconductor Internship</option>
                  <option value="fellowship">Post-Doc / International Fellowship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                  Location / Lab Site
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Bengaluru / IIT Bombay / Hybrid"
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                  Monthly Stipend / Annual CTC
                </label>
                <input
                  type="text"
                  value={formData.stipend}
                  onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                  placeholder="e.g. ₹37,000/month + HRA or ₹14-20 LPA"
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                  External Official Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.apply_link}
                  onChange={(e) => setFormData({ ...formData, apply_link: e.target.value })}
                  placeholder="https://isro.gov.in/advt-102 or leave blank for In-App ATS"
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                Eligibility &amp; GATE/NET Criteria
              </label>
              <input
                type="text"
                value={formData.eligibility}
                onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                placeholder="e.g. B.Tech/M.Tech with valid GATE (EC/EE) score or NET qualification"
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                Skill Tags (Comma separated)
              </label>
              <input
                type="text"
                value={formData.tagsInput}
                onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                placeholder="SystemVerilog, UVM, Cadence, RTL, Physical Design"
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                Detailed Scope of Work &amp; Project Description
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the research project, semiconductor tools used (Cadence Virtuoso, Synopsys ICC2, Siemens Questa), deliverables, and selection interview process..."
                className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-900">
              <Button variant="ghost" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} size="lg">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Publish Position</span>
              </Button>
            </div>

          </Card>
        </form>

      </div>
    </div>
  );
}
