"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, Info, Mail, Search, Menu, X, User, LogOut, CircuitBoard, LogIn, UserPlus, Building2
} from "lucide-react";
import { useUser } from "@/hooks/useUser";

const PUBLIC_NAV_ITEMS = [
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/academy", label: "VLSI Academy", icon: CircuitBoard },
  { href: "/network", label: "Network", icon: User },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: Mail },
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
    <header className="sticky top-0 z-50 bg-white border-b-4 border-slate-900 shadow-[0_4px_0px_0px_rgba(15,23,42,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* BRAND LOGO */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9.5 h-9.5 rounded-xl bg-blue-600 border-2 border-slate-900 flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_#0F172A] group-hover:-translate-y-0.5 group-hover:shadow-[4px_4px_0px_0px_#0F172A] transition-all">
            <CircuitBoard className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              Berojgar<span className="text-blue-600">DegreeWala</span>
            </span>
            <span className="text-[10px] text-slate-600 -mt-1 font-extrabold tracking-wider uppercase">
              Semiconductor &amp; VLSI Hub
            </span>
          </div>
        </Link>

        {/* SEARCH BAR (⌘K) */}
        <form onSubmit={doSearch} className="hidden lg:flex flex-1 max-w-xs relative">
          <Search className="w-4 h-4 text-slate-900 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search VLSI, DRDO, ISRO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-1.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-black text-slate-900 placeholder-slate-400 shadow-[2px_2px_0px_0px_#0F172A] focus:outline-none focus:shadow-[4px_4px_0px_0px_#0F172A] transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-black text-white bg-blue-600 border border-slate-900 rounded shadow-[1px_1px_0px_0px_#0F172A]">
            ⌘K
          </kbd>
        </form>

        {/* HEADER NAV LINKS */}
        <nav className="hidden md:flex items-center gap-1.5">
          {PUBLIC_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 border-slate-900 ${
                  active
                    ? "bg-blue-600 text-white shadow-[2.5px_2.5px_0px_0px_#0F172A]"
                    : "bg-white text-slate-900 hover:bg-blue-50 hover:text-blue-600 hover:shadow-[2px_2px_0px_0px_#0F172A] hover:-translate-y-0.5"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 stroke-[2.5] ${active ? "text-white" : "text-slate-900"}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT ACTIONS: Role Signups & Sign In */}
        <div className="hidden sm:flex items-center gap-2">
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 bg-blue-50 border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_#0F172A] hover:bg-blue-100 transition-all font-black text-xs text-slate-900"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                  {user.email?.[0].toUpperCase() || "U"}
                </div>
                <span className="max-w-[100px] truncate">{user.email?.split("@")[0]}</span>
              </button>
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border-3 border-slate-900 rounded-xl shadow-[5px_5px_0px_0px_#0F172A] py-2 z-50">
                  <div className="px-4 py-2 border-b-2 border-slate-900 bg-slate-50">
                    <p className="text-xs font-black text-slate-900 truncate">{user.email}</p>
                  </div>
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-900 hover:bg-blue-50 hover:text-blue-600">
                    <User className="w-3.5 h-3.5 stroke-[2.5]" /> Profile
                  </Link>
                  <button onClick={() => signOutUser()} className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                    <LogOut className="w-3.5 h-3.5 stroke-[2.5]" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/signup?role=candidate"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black border-2 border-slate-900 rounded-xl shadow-[2.5px_2.5px_0px_0px_#0F172A] transition-all hover:-translate-y-0.5"
              >
                <User className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Job Seeker</span>
              </Link>

              <Link
                href="/signup?role=employer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 text-xs font-black border-2 border-slate-900 rounded-xl shadow-[2.5px_2.5px_0px_0px_#0F172A] transition-all hover:-translate-y-0.5"
              >
                <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Employer</span>
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-black border-2 border-slate-900 rounded-xl shadow-[2.5px_2.5px_0px_0px_#0F172A] transition-all hover:-translate-y-0.5"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Sign In</span>
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-xl border-2 border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5 stroke-[2.5]" /> : <Menu className="w-5 h-5 stroke-[2.5]" />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden border-t-3 border-slate-900 bg-white p-4 space-y-3 shadow-lg">
          <nav className="flex flex-col gap-2">
            {PUBLIC_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A] hover:bg-blue-50"
              >
                <Icon className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="pt-2 border-t-2 border-slate-900 flex flex-col gap-2">
            <Link
              href="/signup?role=candidate"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
            >
              Join as Job Seeker (@username)
            </Link>
            <Link
              href="/signup?role=employer"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-2.5 bg-emerald-500 text-slate-900 rounded-xl text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
            >
              Join as Employer / Research Lab
            </Link>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-2.5 bg-white text-slate-900 rounded-xl text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
