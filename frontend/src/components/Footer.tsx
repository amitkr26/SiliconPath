import Link from "next/link";
import { CircuitBoard } from "lucide-react";

const footerColumns = [
  {
    title: "Learn",
    links: [
      { label: "Learning Paths", href: "/learn" },
      { label: "Academy", href: "/academy" },
      { label: "Digital Electronics", href: "/learn/digital-electronics" },
      { label: "Verilog", href: "/learn/verilog" },
      { label: "Physical Design", href: "/learn/physical-design" },
      { label: "Static Timing Analysis", href: "/learn/static-timing-analysis" },
    ],
  },
  {
    title: "Practice",
    links: [
      { label: "Engineering Lab", href: "/engineering-lab" },
      { label: "STA Interview Q&A", href: "/sta-interview-questions" },
      { label: "Design Verification", href: "/learn/design-verification" },
      { label: "Design for Test", href: "/learn/design-for-test" },
      { label: "Low Power Design", href: "/learn/low-power" },
    ],
  },
  {
    title: "Career",
    links: [
      { label: "Career Roadmap", href: "/learn/career-roadmap" },
      { label: "Resources", href: "/courses" },
      { label: "TCL for EDA", href: "/learn/tcl-for-eda" },
      { label: "Linux for VLSI", href: "/learn/linux-for-vlsi" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About SiliconPath", href: "/about" },
      { label: "BerojgarDegreeWala — Opportunities", href: "https://berojgardegreewala.vercel.app" },
      { label: "ElectroBridge — Resume Builder", href: "https://electrobridge.vercel.app" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Top: Logo + columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Logo column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <CircuitBoard className="w-5 h-5 text-white stroke-[2]" />
              </div>
              <span className="font-display font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                Silicon<span className="text-blue-400">Path</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-[200px]">
              Free VLSI learning for semiconductor engineers.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => {
                  const isExternal = link.href.startsWith("http");
                  return (
                    <li key={link.href}>
                      {isExternal ? (
                        <a href={link.href} target="_blank" rel="noopener" className="text-sm text-slate-400 hover:text-white transition-colors">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} SiliconPath. Learn. Build. Sign Off.
          </p>
          <p className="text-slate-600 text-xs">
            Built for India&apos;s semiconductor and electronics ecosystem.
          </p>
        </div>
      </div>
    </footer>
  );
}
