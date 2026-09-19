"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Briefcase, Menu, X, User, LogOut, CircuitBoard, Building2, ChevronDown,
  Users, MessageSquare, PlusCircle, Bookmark,
  LayoutDashboard, LogIn, Settings, Search, Bell, Home, Newspaper, Sparkles,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { FOOTER_SOCIAL_LINKS } from "@/config/socials";
import { SocialIcon } from "@/components/ui/SocialIcons";
import { useNotificationCount } from "@/hooks/useNotifications";
import { useUnreadMessageCount } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, username, displayName, isCandidate, isEmployer, signOut: signOutUser } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [joinDropdownOpen, setJoinDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userRef = useRef<HTMLDivElement>(null);
  const joinRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: notifCountData } = useNotificationCount(!!user);
  const { data: unreadMsgData } = useUnreadMessageCount(!!user);
  const unreadNotifs = notifCountData?.count ?? 0;
  const unreadMessages = unreadMsgData?.unread_count ?? 0;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (joinRef.current && !joinRef.current.contains(e.target as Node)) {
        setJoinDropdownOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const isEmployerRoute = pathname.startsWith("/employer") || pathname === "/post-job";

  const navItems = !user
    ? [
        { href: "/", label: "Home", icon: Home },
        { href: "/opportunities", label: "Opportunities", icon: Briefcase },
        { href: "/organizations", label: "Organizations", icon: Building2 },
        { href: "/news", label: "News", icon: Newspaper },
        { href: "/resources", label: "Resources", icon: Building2 },
        { href: "/about", label: "About", icon: Users },
      ]
    : isEmployer && isEmployerRoute
    ? [
        { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/employer/jobs", label: "Jobs", icon: Briefcase },
        { href: "/employer/applicants", label: "Applicants", icon: Users },
        { href: "/employer/talent", label: "Talent", icon: Users },
        { href: "/opportunities", label: "Browse Main Site", icon: Home },
      ]
    : [
        { href: "/", label: "Home", icon: Home },
        { href: "/opportunities", label: "Opportunities", icon: Briefcase },
        { href: "/ask-ai", label: "Ask AI", icon: Sparkles },
        { href: "/feed", label: "Feed", icon: Newspaper },
        { href: "/network", label: "Network", icon: Users },
      ];

  const Badge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none ring-2 ring-white">
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 lg:gap-4">

        {/* BRAND LOGO */}
        <Link
          href={isEmployer ? "/employer/dashboard" : "/"}
          className="flex items-center gap-2 group shrink-0"
        >
          <div className="relative h-9 w-36 sm:h-10 sm:w-44">
            <Image
              src="/images/brand/logo.png"
              alt="BerojgarDegreeWala"
              fill
              priority
              unoptimized
              className="object-contain object-left"
              sizes="(max-width: 640px) 144px, 176px"
            />
          </div>
          {isEmployer && (
            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[9px] font-bold text-blue-600 uppercase tracking-wider border border-blue-100 shrink-0">
              Employer
            </span>
          )}
        </Link>

        {/* DESKTOP NAV LINKS */}
        <nav className="hidden xl:flex items-center gap-0.5">
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

          {/* SEARCH (desktop) */}
          <div className="hidden xl:flex items-center relative">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              placeholder="Search opportunities..."
              aria-label="Search opportunities"
              className="w-40 xl:w-44 2xl:w-56 pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>

          {/* NOTIFICATION BELL */}
          {user && (
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <Badge count={unreadNotifs} />
            </Link>
          )}

          {/* MESSAGE BELL */}
          {user && (
            <Link
              href={isEmployer ? "/employer/messages" : "/messages"}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              aria-label="Messages"
            >
              <MessageSquare className="w-5 h-5" />
              <Badge count={unreadMessages} />
            </Link>
          )}

          {/* POST JOB (employer) */}
          {isEmployer && (
            <Link
              href="/employer/post-job"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Post Job
            </Link>
          )}

          {/* USER DROPDOWN OR GUEST CTAS */}
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
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {displayName || user.email?.split("@")[0]}
                    </p>
                    {username && (
                      <p className="text-xs text-blue-600 font-medium">@{username}</p>
                    )}
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                      {isEmployer ? "Employer Account" : "Job Seeker Account"}
                    </p>
                  </div>

                  {/* Standard Candidate Links */}
                  <DropdownLink href="/profile" icon={User} onClick={() => setUserDropdownOpen(false)}>
                    My Profile
                  </DropdownLink>
                  <DropdownLink href="/dashboard" icon={LayoutDashboard} onClick={() => setUserDropdownOpen(false)}>
                    Applications & Dashboard
                  </DropdownLink>
                  <DropdownLink href="/saved" icon={Bookmark} onClick={() => setUserDropdownOpen(false)}>
                    Saved Jobs
                  </DropdownLink>
                  {/* Employer Capabilities Section */}
                  {isEmployer && (
                    <>
                      <div className="my-1.5 border-t border-slate-100 px-4 pt-1.5 pb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                          Employer Portal
                        </span>
                      </div>
                      <DropdownLink href="/employer/dashboard" icon={LayoutDashboard} onClick={() => setUserDropdownOpen(false)}>
                        Employer Dashboard
                      </DropdownLink>
                      <DropdownLink href="/employer/jobs" icon={Briefcase} onClick={() => setUserDropdownOpen(false)}>
                        Manage Job Listings
                      </DropdownLink>
                      <DropdownLink href="/employer/applicants" icon={Users} onClick={() => setUserDropdownOpen(false)}>
                        ATS Applicants
                      </DropdownLink>
                      <DropdownLink href="/employer/talent" icon={Users} onClick={() => setUserDropdownOpen(false)}>
                        Talent Sourcing
                      </DropdownLink>
                      <DropdownLink href="/employer/post-job" icon={PlusCircle} onClick={() => setUserDropdownOpen(false)}>
                        Post Opportunity
                      </DropdownLink>
                    </>
                  )}

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
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-2xs transition-all"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="xl:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE MENU DRAWER */}
      {menuOpen && (
        <div className="xl:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2 space-y-1">
          {/* MOBILE SEARCH */}
          <div className="flex items-center relative mb-3">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  setMenuOpen(false);
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  setSearchQuery("");
                }
              }}
              placeholder="Search..."
              aria-label="Search"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-body text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

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

          {/* MOBILE NOTIFICATION / MESSAGE LINKS */}
          {user && (
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Link
                href="/notifications"
                onClick={() => setMenuOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                Notifications
                <Badge count={unreadNotifs} />
              </Link>
              <Link
                href={isEmployer ? "/employer/messages" : "/messages"}
                onClick={() => setMenuOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors relative"
              >
                <MessageSquare className="w-4 h-4" />
                Messages
                <Badge count={unreadMessages} />
              </Link>
            </div>
          )}

          {/* MOBILE SOCIAL — FOLLOW US */}
          <div className="pt-2 border-t border-slate-100">
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Follow us
            </p>
            <div className="flex flex-wrap items-center gap-2 px-3">
              {FOOTER_SOCIAL_LINKS.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`BerojgarDegreeWala on ${social.label}`}
                  onClick={() => setMenuOpen(false)}
                  className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <SocialIcon platform={social.platform} className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* MOBILE AUTH ACTIONS */}
          {!user ? (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
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

function DropdownLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
    >
      <Icon className="w-4 h-4 text-slate-400" />
      {children}
    </Link>
  );
}
