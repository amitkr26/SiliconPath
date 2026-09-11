import {
  CircuitBoard,
  BookOpen,
  GraduationCap,
  Heart,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const whatWeOffer = [
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Free Learning Paths",
    desc: "15 structured paths covering the full VLSI flow — from Digital Electronics to Physical Verification. Every topic is free.",
  },
  {
    icon: <GraduationCap className="w-5 h-5" />,
    title: "Hands-on Courses",
    desc: "Practical courses on RTL-to-GDS, interview prep, and career development. Built by engineers who ship silicon.",
  },
  {
    icon: <CircuitBoard className="w-5 h-5" />,
    title: "Engineering Lab",
    desc: "Debug real EDA report excerpts — setup violations, hold issues, congestion, clock skew. Build debugging intuition.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-12">

        {/* HERO */}
        <Card tone="accent" className="p-8 sm:p-12 shadow-brutal-lg relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-black border-2 border-slate-900 shadow-brutal-sm">
              <Heart className="w-4 h-4 text-red-500 stroke-[2.5]" />
              <span>BUILT BY ENGINEERS, FOR ENGINEERS</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              About SiliconPath
            </h1>
            <p className="text-blue-50 text-sm sm:text-base font-medium leading-relaxed">
              A free, structured VLSI learning platform — from RTL to GDSII, from beginner to signoff.
            </p>
          </div>
        </Card>

        {/* WHAT WE OFFER */}
        <div className="space-y-6">
          <h2 className="font-black text-slate-900 text-2xl">What we offer</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {whatWeOffer.map((item) => (
              <Card key={item.title} hover className="p-5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-slate-900 flex items-center justify-center text-blue-600 mb-3">
                  {item.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* WHO BUILT IT */}
        <Card className="p-6 sm:p-8">
          <h2 className="font-black text-slate-900 text-2xl mb-4">Who built it</h2>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              SiliconPath is built and maintained by a working VLSI engineer with experience in physical design and timing signoff across advanced process nodes.
            </p>
            <p>
              The goal is simple: create the resource I wished I had when starting out. Structured, practical, no fluff — just the knowledge and practice that actually gets you hired and helps you perform on the job.
            </p>
            <p>
              Every learning path, every interview question, every lab case is drawn from real industry experience. No regurgitated textbook content — this is what actually matters in practice.
            </p>
          </div>
        </Card>

        {/* CONTACT */}
        <Card tone="inverse" className="p-8 text-center">
          <h2 className="text-xl font-black text-white mb-2">Get in touch</h2>
          <p className="text-slate-300 text-sm font-medium mb-4">
            Questions, feedback, or just want to say hello?
          </p>
          <p className="text-blue-400 font-mono text-sm font-bold mb-5">
            hello@siliconpath.in
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button href="/" variant="secondary" size="lg">
              Back to Home <ArrowRight className="w-4 h-4" />
            </Button>
            <Button href="/courses" variant="ghost" size="lg" className="text-white border-white/20 hover:bg-white/10">
              Browse Courses
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
