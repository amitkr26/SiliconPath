"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, Menu, X, User, LogOut, CircuitBoard, Building2, ChevronDown, UserPlus, GraduationCap, Users, MessageSquare
} from "lucide-react";
import { useUser } from "@/hooks/useUser";

const MAIN_NAV_ITEMS = [
  { href: "/opportunities", label: "Jobs & Opportunities", icon: Briefcase },
  { href: "/academy", label: "VLSI Courses", icon: GraduationCap },
  { href: "/network", label: "Professional Network", icon: Users },
  { href: "/community", label: "Community Forum", icon: MessageSquare },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut: signOutUser } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [joinDropdownOpen, setJoinDropdownOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const joinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (joinRef.current && !joinRef.current.contains(e.target as Node)) {
        setJoinDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b-4 border-slate-900 shadow-[0_4px_0px_0px_rgba(15,23,42,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        
        {/* BRAND LOGO */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9.5 h-9.5 rounded-xl bg-blue-600 border-2 border-slate-900 flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_#0F172A] group-hover:-translate-y-0.5 group-hover:shadow-[4px_4px_0px_0px_#0F172A] transition-all">
            <CircuitBoard className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              Berojgar<span className="text-blue-600">DegreeWala</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-600 -mt-1 font-extrabold tracking-wider uppercase">
              Semiconductor &amp; VLSI Career Portal
            </span>
          </div>
        </Link>

        {/* MAIN NAVIGATION LINKS (CENTERED & UN-CROWDED) */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3">
          {MAIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3.5 py-2 lg:px-4 rounded-xl text-xs font-black transition-all border-2 border-slate-900 ${
                  active
                    ? "bg-blue-600 text-white shadow-[2.5px_2.5px_0px_0px_#0F172A]"
                    : "bg-white text-slate-900 hover:bg-blue-50 hover:text-blue-600 hover:shadow-[2px_2px_0px_0px_#0F172A] hover:-translate-y-0.5"
                }`}
              >
                <Icon className={`w-4 h-4 stroke-[2.5] ${active ? "text-white" : "text-slate-900"}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* RIGHT ACTION BUTTON (USER PROFILE OR JOIN PLATFORM) */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 bg-blue-50 border-2 border-slate-900 rounded-xl shadow-[2.5px_2.5px_0px_0px_#0F172A] hover:bg-blue-100 transition-all font-black text-xs text-slate-900"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs border border-slate-900">
                  {user.email?.[0].toUpperCase() || "U"}
                </div>
                <span className="max-w-[110px] truncate">{user.email?.split("@")[0]}</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5] text-slate-700" />
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
            <div className="relative" ref={joinRef}>
              <button
                onClick={() => setJoinDropdownOpen(!joinDropdownOpen)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_#0F172A] transition-all hover:-translate-y-0.5"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Join Platform</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              {joinDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border-3 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_#0F172A] p-2 z-50 space-y-1.5">
                  <Link
                    href="/signup?role=candidate"
                    onClick={() => setJoinDropdownOpen(false)}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-blue-50 border border-transparent hover:border-slate-900 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 border border-slate-900 shadow-[1.5px_1.5px_0px_0px_#0F172A]">
                      <User className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 group-hover:text-blue-600">Candidate / Researcher</p>
                      <p className="text-[10px] font-bold text-slate-500">Claim unique @username profile</p>
                    </div>
                  </Link>

                  <Link
                    href="/signup?role=employer"
                    onClick={() => setJoinDropdownOpen(false)}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-slate-900 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-900 flex items-center justify-center shrink-0 border border-slate-900 shadow-[1.5px_1.5px_0px_0px_#0F172A]">
                      <Building2 className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 group-hover:text-emerald-700">Employer / Research Lab</p>
                      <p className="text-[10px] font-bold text-slate-500">Post JRF, PhD &amp; VLSI roles</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
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

      {/* MOBILE MENU DRAWER */}
      {menuOpen && (
        <div className="md:hidden border-t-3 border-slate-900 bg-white p-4 space-y-3 shadow-lg">
          <nav className="flex flex-col gap-2">
            {MAIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A] hover:bg-blue-50"
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
              Join as Candidate (@username)
            </Link>
            <Link
              href="/signup?role=employer"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-2.5 bg-emerald-500 text-slate-900 rounded-xl text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
            >
              Join as Employer / Research Lab
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
