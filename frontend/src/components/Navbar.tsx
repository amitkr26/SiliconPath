"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, Menu, X, User, LogOut, CircuitBoard, Building2, ChevronDown,
  GraduationCap, Users, MessageSquare, PlusCircle, Bookmark, FileText,
  LayoutDashboard, LogIn, Settings, Search, Bell, Home, Newspaper,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useNotificationCount } from "@/hooks/useNotifications";
import { useConversations } from "@/hooks/useMessages";
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

  const { data: notifCountData } = useNotificationCount();
  const { data: conversationsData } = useConversations();
  const unreadNotifs = notifCountData?.count ?? 0;
  const unreadMessages = (conversationsData?.conversations ?? []).filter(
    (c: any) => c.unread_count > 0
  ).length;

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

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const navItems = !user
    ? [
        { href: "/opportunities", label: "Opportunities", icon: Briefcase },
        { href: "/feed", label: "Feed", icon: Newspaper },
        { href: "/about", label: "About", icon: Building2 },
        { href: "/contact", label: "Contact", icon: Users },
      ]
    : isEmployer
    ? [
        { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/employer/jobs", label: "Jobs", icon: Briefcase },
        { href: "/employer/applicants", label: "Applicants", icon: Users },
        { href: "/employer/talent", label: "Talent", icon: GraduationCap },
        { href: "/employer/messages", label: "Messages", icon: MessageSquare },
      ]
    : [
        { href: "/", label: "Home", icon: Home },
        { href: "/opportunities", label: "Opportunities", icon: Briefcase },
        { href: "/network", label: "Network", icon: Users },
        { href: "/feed", label: "Feed", icon: Newspaper },
        { href: "/messages", label: "Messages", icon: MessageSquare },
        { href: "/notifications", label: "Notifications", icon: Bell },
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
          href={isEmployer ? "/employer/dashboard" : "/"}
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <CircuitBoard className="w-4.5 h-4.5 text-white stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm sm:text-base md:text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors leading-none">
                Berojgar<span className="text-blue-600">DegreeWala</span>
              </span>
              {isEmployer && (
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[9px] font-bold text-blue-600 uppercase tracking-wider">
                  Employer
                </span>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 font-medium tracking-wider uppercase">
              {isEmployer ? "Recruiter Portal" : "Semiconductor Careers"}
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

          {/* SEARCH (desktop) */}
          <div className="hidden lg:flex items-center relative">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              placeholder="Search..."
              className="w-52 pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-body text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
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
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {displayName || user.email?.split("@")[0]}
                    </p>
                    {username && (
                      <p className="text-xs text-blue-600 font-medium">@{username}</p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      {isEmployer ? "Employer Account" : "Job Seeker Account"}
                    </p>
                  </div>

                  {isEmployer ? (
                    <>
                      <DropdownLink href="/employer/dashboard" icon={LayoutDashboard} onClick={() => setUserDropdownOpen(false)}>
                        Dashboard
                      </DropdownLink>
                      <DropdownLink href="/employer/jobs" icon={Briefcase} onClick={() => setUserDropdownOpen(false)}>
                        Manage Jobs
                      </DropdownLink>
                      <DropdownLink href="/employer/applicants" icon={Users} onClick={() => setUserDropdownOpen(false)}>
                        Applicants
                      </DropdownLink>
                      <DropdownLink href="/employer/talent" icon={GraduationCap} onClick={() => setUserDropdownOpen(false)}>
                        Talent Sourcing
                      </DropdownLink>
                      <DropdownLink href="/employer/messages" icon={MessageSquare} onClick={() => setUserDropdownOpen(false)}>
                        Messages
                      </DropdownLink>
                      <DropdownLink href="/employer/profile" icon={User} onClick={() => setUserDropdownOpen(false)}>
                        Company Profile
                      </DropdownLink>
                      <DropdownLink href="/employer/settings" icon={Settings} onClick={() => setUserDropdownOpen(false)}>
                        Settings
                      </DropdownLink>
                    </>
                  ) : (
                    <>
                      <DropdownLink href="/profile" icon={User} onClick={() => setUserDropdownOpen(false)}>
                        My Profile
                      </DropdownLink>
                      <DropdownLink href="/dashboard" icon={LayoutDashboard} onClick={() => setUserDropdownOpen(false)}>
                        Dashboard
                      </DropdownLink>
                      <DropdownLink href="/saved" icon={Bookmark} onClick={() => setUserDropdownOpen(false)}>
                        Saved Jobs
                      </DropdownLink>
                      <DropdownLink href="/resume" icon={FileText} onClick={() => setUserDropdownOpen(false)}>
                        My Resume
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
            <div className="relative" ref={joinRef}>
              <Button size="sm" onClick={() => setJoinDropdownOpen(!joinDropdownOpen)} ariaLabel="Sign in or join">
                <LogIn className="w-4 h-4" />
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
                    <LogIn className="w-4 h-4 text-slate-400" />
                    Existing User Sign In
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <Link
                    href="/signup?role=candidate"
                    onClick={() => setJoinDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Join as Candidate
                  </Link>
                  <Link
                    href="/signup?role=employer"
                    onClick={() => setJoinDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-slate-400" />
                    Join as Employer
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
