"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, Menu, X, User, LogOut, CircuitBoard, Building2, ChevronDown,
  GraduationCap, Users, MessageSquare, PlusCircle, Bookmark, FileText, LayoutDashboard, LogIn
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isCandidate, isEmployer, signOut: signOutUser } = useUser();
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

  // Determine dynamic navigation items based on role & auth status
  const navItems = !user
    ? [
        { href: "/opportunities", label: "Opportunities", icon: Briefcase },
        { href: "/news", label: "News & Feed", icon: MessageSquare },
        { href: "/about", label: "About", icon: Building2 },
        { href: "/contact", label: "Contact", icon: Users },
      ]
    : isEmployer
    ? [
        { href: "/post-job", label: "Post Position", icon: PlusCircle },
        { href: "/employers/postings", label: "My Postings", icon: Building2 },
        { href: "/employers/applicants", label: "Applicants", icon: Users },
        { href: "/employers/profile", label: "Company Profile", icon: Building2 },
        { href: "/opportunities", label: "Opportunities", icon: Briefcase },
        { href: "/about", label: "About", icon: Building2 },
      ]
    : [
        { href: "/opportunities", label: "Opportunities", icon: Briefcase },
        { href: "/applications", label: "My Applications", icon: FileText },
        { href: "/saved", label: "Saved", icon: Bookmark },
        { href: "/resume", label: "My Resume", icon: FileText },
        { href: "/network", label: "Network", icon: Users },
        { href: "/messages", label: "Messages", icon: MessageSquare },
        { href: "/about", label: "About", icon: Building2 },
      ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-slate-900 shadow-brutal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">

        {/* BRAND LOGO */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 border-2 border-slate-900 flex items-center justify-center shadow-brutal-sm">
            <CircuitBoard className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors leading-none">
              Berojgar<span className="text-blue-600">DegreeWala</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 font-semibold tracking-wider uppercase">
              Semiconductor &amp; VLSI Portal
            </span>
          </div>
        </Link>

        {/* ROLE-BASED DYNAMIC NAVIGATION LINKS — text-first, active state as pill */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-blue-600",
                )}
              >
                <Icon className={cn("w-4 h-4", active ? "text-white" : "text-slate-500")} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* RIGHT ACTION BUTTON (USER PROFILE OR SIGN IN / JOIN) */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 bg-white border-2 border-slate-900 rounded-full shadow-brutal-sm hover:bg-slate-50 transition-all font-semibold text-xs text-slate-900"
              >
                <div className="w-7 h-7 rounded-full border-2 border-slate-900 bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-brutal-sm">
                  {user.email?.[0].toUpperCase() || "U"}
                </div>
                <div className="flex flex-col text-left">
                  <span className="max-w-[100px] truncate leading-none text-slate-900 font-bold">{user.email?.split("@")[0]}</span>
                  <span className="text-[9px] font-bold uppercase text-blue-700 leading-none mt-0.5">
                    {isEmployer ? "Employer" : "Candidate"}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border-2 border-slate-900 rounded-xl shadow-brutal-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.email}</p>
                    <p className="text-[10px] font-bold uppercase text-blue-600">
                      {isEmployer ? "Employer Account" : "Job Seeker Account"}
                    </p>
                  </div>

                  {isEmployer ? (
                    <>
                      <Link
                        href="/employers/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" /> Employer Dashboard
                      </Link>
                      <Link
                        href="/employers/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <Building2 className="w-3.5 h-3.5" /> Company Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <User className="w-3.5 h-3.5" /> Candidate Profile
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" /> My Dashboard
                      </Link>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      signOutUser();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border-t border-slate-100"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative" ref={joinRef}>
              <Button size="sm" onClick={() => setJoinDropdownOpen(!joinDropdownOpen)} ariaLabel="Sign in or join">
                <LogIn className="w-4 h-4" />
                <span>Sign In / Join</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>

              {joinDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-slate-900 rounded-2xl shadow-brutal p-2 z-50 space-y-1.5">
                  <Link
                    href="/login"
                    onClick={() => setJoinDropdownOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 border border-slate-900 bg-slate-50 transition-all font-bold text-xs text-slate-900"
                  >
                    <LogIn className="w-4 h-4 text-blue-600" />
                    <span>Existing User Sign In</span>
                  </Link>

                  <div className="border-t border-slate-200 my-1 pt-1">
                    <p className="text-[10px] font-bold uppercase text-slate-400 px-2 mb-1">Create New Account</p>
                    <Link
                      href="/signup?role=candidate"
                      onClick={() => setJoinDropdownOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-blue-50 border border-transparent hover:border-slate-900 transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 border border-slate-900 shadow-brutal-sm">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Job Seeker / Student</p>
                        <p className="text-[10px] font-medium text-slate-500">Apply &amp; track positions</p>
                      </div>
                    </Link>

                    <Link
                      href="/signup?role=employer"
                      onClick={() => setJoinDropdownOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-slate-900 transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-900 flex items-center justify-center shrink-0 border border-slate-900 shadow-brutal-sm">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Employer / Research Lab</p>
                        <p className="text-[10px] font-medium text-slate-500">Post roles &amp; view applicants</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 rounded-xl border-2 border-slate-900 bg-white text-slate-900 shadow-brutal-sm"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE MENU DRAWER */}
      {menuOpen && (
        <div className="lg:hidden border-t-2 border-slate-900 bg-white p-4 space-y-3 shadow-lg">
          <nav className="flex flex-col gap-2">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-900 hover:bg-slate-100"
              >
                <Icon className="w-4 h-4 text-blue-600" />
                {label}
              </Link>
            ))}
          </nav>

          {!user && (
            <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
              <Button variant="secondary" size="sm" href="/login" onClick={() => setMenuOpen(false)}>
                Sign In
              </Button>
              <Button size="sm" href="/signup?role=candidate" onClick={() => setMenuOpen(false)}>
                Join as Candidate
              </Button>
              <Button variant="success" size="sm" href="/signup?role=employer" onClick={() => setMenuOpen(false)}>
                Join as Employer
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}