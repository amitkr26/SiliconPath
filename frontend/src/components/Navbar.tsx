"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu, X, User, LogOut, CircuitBoard, ChevronDown,
  GraduationCap, Home,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, username, displayName, signOut: signOutUser } = useUser();
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

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/academy", label: "Academy", icon: GraduationCap },
  ];

  const Badge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none ring-2 ring-white">
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* BRAND LOGO */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <CircuitBoard className="w-4.5 h-4.5 text-white stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm sm:text-base md:text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors leading-none">
                Silicon<span className="text-blue-600">Path</span>
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 font-medium tracking-wider uppercase">
              VLSI Academy
            </span>
          </div>
        </Link>

        {/* DESKTOP NAV LINKS */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors",
                  active
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT SECTION */}
        <div className="hidden sm:flex items-center gap-2">

          {/* USER DROPDOWN */}
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {user.email?.[0].toUpperCase() || "U"}
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", userDropdownOpen && "rotate-180")} />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {displayName || user.email?.split("@")[0]}
                    </p>
                    {username && (
                      <p className="text-xs text-blue-600 font-medium">@{username}</p>
                    )}
                  </div>

                  <Link
                    href="/academy"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    My Academy
                  </Link>

                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      signOutUser();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative" ref={joinRef}>
              <Button size="sm" onClick={() => setJoinDropdownOpen(!joinDropdownOpen)} ariaLabel="Sign in or join">
                <User className="w-4 h-4" />
                <span>Sign In</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>

              {joinDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  <Link
                    href="/login"
                    onClick={() => setJoinDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Sign In
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <Link
                    href="/signup"
                    onClick={() => setJoinDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    Join Academy
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE MENU DRAWER */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2 space-y-1">
          <nav className="flex flex-col gap-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium font-body transition-colors",
                    active
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* MOBILE AUTH ACTIONS */}
          {!user ? (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Button variant="secondary" size="sm" href="/login" onClick={() => setMenuOpen(false)}>
                Sign In
              </Button>
              <Button size="sm" href="/signup" onClick={() => setMenuOpen(false)}>
                Join Academy
              </Button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOutUser();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
