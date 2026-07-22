"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, GraduationCap, Sparkles, Users, FileText,
  Search, Menu, X, User, LogOut, CircuitBoard
} from "lucide-react";
import { useUser } from "@/hooks/useUser";

const PUBLIC_NAV_ITEMS = [
  { href: "/academy", label: "VLSI Academy", icon: GraduationCap },
  { href: "/feed", label: "Feed", icon: Sparkles },
  { href: "/network", label: "Network", icon: Users },
  { href: "/messages", label: "Messages", icon: Briefcase },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut: signOutUser } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/network?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      searchRef.current?.blur();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-cyan-900/30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* BRAND LOGO */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
            <CircuitBoard className="w-5 h-5 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              Silicon<span className="text-cyan-400">Path</span>
            </span>
            <span className="text-[10px] text-cyan-400 -mt-1 font-medium tracking-wide">
              VLSI Academy & Hardware Network
            </span>
          </div>
        </Link>

        {/* SEARCH BAR (⌘K) */}
        <form onSubmit={doSearch} className="hidden md:flex flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search Verilog, UVM, Physical Design, Hardware Engineers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:bg-slate-950 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded shadow-xs">
            ⌘K
          </kbd>
        </form>

        {/* NAV LINKS */}
        <nav className="hidden lg:flex items-center gap-1">
          {PUBLIC_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active
                    ? "bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-cyan-400" : "text-slate-400"}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
                  {user.email?.[0].toUpperCase() || "U"}
                </div>
              </button>
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs font-semibold text-slate-200 truncate">{user.email}</p>
                  </div>
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white">
                    <User className="w-3.5 h-3.5" /> Profile
                  </Link>
                  <button onClick={() => signOutUser()} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-slate-800">
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-3.5 py-1.5 rounded-full border border-cyan-500/30 hover:bg-cyan-950/50 transition-colors"
            >
              Sign In
            </Link>
          )}

          {/* MOBILE MENU TRIGGER */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {menuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-cyan-900/30 px-4 py-4 space-y-2">
          {PUBLIC_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
            >
              <Icon className="w-4 h-4 text-cyan-400" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
