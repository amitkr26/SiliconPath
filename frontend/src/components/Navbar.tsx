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
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/academy", label: "VLSI Academy", icon: GraduationCap },
  { href: "/news", label: "News", icon: Sparkles },
  { href: "/organizations", label: "Organizations", icon: Users },
  { href: "/resources", label: "Resources", icon: FileText },
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
      router.push(`/opportunities?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      searchRef.current?.blur();
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-nav transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* BRAND LOGO */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
            <CircuitBoard className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              Berojgar<span className="text-blue-600">DegreeWala</span>
            </span>
            <span className="text-[10px] text-slate-500 -mt-1 font-medium tracking-wide">
              Semiconductor & VLSI Aggregator
            </span>
          </div>
        </Link>

        {/* SEARCH BAR (⌘K) */}
        <form onSubmit={doSearch} className="hidden md:flex flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search JRF, PhD, DRDO, ISRO, Intel, RTL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-xs">
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
                    ? "bg-blue-50 text-blue-600 border border-blue-200 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-blue-600" : "text-slate-400"}`} />
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
                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                  {user.email?.[0].toUpperCase() || "U"}
                </div>
              </button>
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">{user.email}</p>
                  </div>
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                    <User className="w-3.5 h-3.5" /> Profile
                  </Link>
                  <button onClick={() => signOutUser()} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-slate-50">
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="text-xs text-slate-700 hover:text-slate-900 font-medium px-3.5 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
          )}

          {/* MOBILE MENU TRIGGER */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2">
          {PUBLIC_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
            >
              <Icon className="w-4 h-4 text-blue-600" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
