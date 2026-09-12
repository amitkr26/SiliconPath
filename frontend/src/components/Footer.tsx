import Link from "next/link";
import { CircuitBoard } from "lucide-react";

const footerColumns = [
  {
    title: "Learn+",
    links: [
      { label: "Academy", href: "/academy" },
      { label: "Digital Electronics", href: "/learn/digital-electronics" },
      { label: "Verilog", href: "/learn/verilog" },
      { label: "Design Verification", href: "/learn/design-verification" },
      { label: "Clock Domain Crossing", href: "/learn/clock-domain-crossing" },
      { label: "Hardware Protocols", href: "/learn/hardware-protocols" },
    ],
  },
  {
    title: "Design+",
    links: [
      { label: "Synthesis", href: "/learn/synthesis" },
      { label: "Physical Design", href: "/learn/physical-design" },
      { label: "Static Timing Analysis", href: "/learn/static-timing-analysis" },
      { label: "Physical Verification", href: "/learn/physical-verification" },
      { label: "Design for Test", href: "/learn/design-for-test" },
      { label: "Low Power", href: "/learn/low-power" },
    ],
  },
  {
    title: "Build+",
    links: [
      { label: "Engineering Lab", href: "/engineering-lab" },
      { label: "TCL for EDA", href: "/learn/tcl-for-eda" },
      { label: "Linux for VLSI", href: "/learn/linux-for-vlsi" },
      { label: "Open-source Flows", href: "/courses" },
    ],
  },
  {
    title: "Career+",
    links: [
      { label: "Interview Prep", href: "/sta-interview-questions" },
      { label: "Career Roadmap", href: "/learn/career-roadmap" },
    ],
  },
  {
    title: "SiliconPath+",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Our Ecosystem",
    links: [
      { label: "BerojgarDegreeWala — Opportunities & Career Hub", href: "https://berojgardegreewala.vercel.app" },
      { label: "ElectroBridge — AI Resume Builder for Engineers", href: "https://electrobridge.vercel.app" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Top: Logo + columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
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
          <div className="flex items-center gap-4 text-slate-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
