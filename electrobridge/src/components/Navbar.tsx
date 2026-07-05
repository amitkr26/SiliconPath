"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Zap, ChevronDown, ChevronRight, User, LogOut, LayoutDashboard,
  Search, Menu, X, Briefcase, BookOpen, GraduationCap, BookMarked,
  Globe, Sparkles, Network, FileText, ArrowRight, MessageSquare,
  Newspaper, TrendingUp, HelpCircle, Bell, Home, Building2,
  Users, Send, CircuitBoard
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { FEATURES } from "@/lib/feature-flags";

const NAV_ITEMS = [
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/feed", label: "Feed", icon: Users },
  { href: "/academy", label: "Academy", icon: GraduationCap },
  { href: "/chat", label: "Ask AI", icon: CircuitBoard },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifCount, setNotifCount] = useState(0);
  const ddTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const showDD = useCallback((name: string) => {
    if (ddTimer.current) clearTimeout(ddTimer.current);
    setOpenDropdown(name);
  }, []);

  const hideDD = useCallback((name: string) => {
    ddTimer.current = setTimeout(() => {
      setOpenDropdown((prev) => (prev === name ? null : prev));
    }, 200);
  }, []);

  const toggleDD = useCallback((name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
      if (ddTimer.current) clearTimeout(ddTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!user) { setNotifCount(0); return; }
    const fetchCount = () => fetch("/api/notifications/count")
      .then(async (r) => { if (r.ok) { const d = await r.json(); setNotifCount(d.count || 0); } })
      .catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    if (debouncedSearch.trim()) {
      router.prefetch(`/opportunities?search=${encodeURIComponent(debouncedSearch.trim())}`);
    }
  }, [debouncedSearch, router]);

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/opportunities?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      searchRef.current?.blur();
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserDropdownOpen(false);
    router.push("/");
    router.refresh();
  };

  const initials = (name?: string | null, email?: string) => {
    if (name) return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
    return email?.substring(0, 2).toUpperCase() ?? "U";
  };

  const displayName = user?.user_metadata?.full_name || user?.email || "User";
  const isAdmin = user?.user_metadata?.role === "admin";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/feed") return pathname.startsWith("/feed");
    if (href === "/network") return pathname.startsWith("/network");
    if (href === "/companies") return pathname.startsWith("/companies");
    if (href === "/opportunities") return pathname.startsWith("/opportunities") || pathname.startsWith("/category");
    if (href === "/news") return pathname.startsWith("/news");
    if (href === "/community") return pathname.startsWith("/community");
    if (href === "/resources") return pathname.startsWith("/resources");
    if (href === "/more") {
      return MORE_LINKS.some(link => pathname.startsWith(link.href));
    }
    return pathname.startsWith(href);
  };

  const isActiveSub = (parent: string, href: string) => {
    if (parent === "/opportunities") return pathname === href || pathname.startsWith("/category");
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-bg-primary/85 backdrop-blur-2xl border-b border-accent/10 shadow-[0_4px_30px_rgba(34,211,238,0.06)]"
            : "bg-gradient-to-b from-bg-primary/80 to-transparent backdrop-blur-md"
        }`}
      >
        {scrolled && (
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent animate-pulse" />
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4 xl:gap-8">
              <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 group-hover:from-accent/30 group-hover:to-accent/10 transition-all shadow-glow-sm">
                  <Zap className="w-4 h-4 text-accent" />
                </div>
                <span className="font-display text-lg font-bold tracking-tight text-text-primary whitespace-nowrap">
                  Silicon<span className="text-accent">Path</span>
                </span>
              </Link>

              <div className="hidden lg:flex items-center gap-0.5 xl:gap-1.5">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 xl:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                        active
                          ? "text-accent bg-accent/10"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="hidden lg:flex items-center flex-1 max-w-[160px] xl:max-w-md mx-4 lg:mx-6">
              <form onSubmit={doSearch} className="relative w-full group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-accent transition-colors" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search opportunities..."
                  className="w-full pl-9 pr-20 py-2 bg-surface/80 border border-border/60 rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40 focus:bg-surface transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-bg-primary/80 border border-border/50 rounded text-[10px] font-medium text-text-muted/50">
                    <span className="text-xs">&#8984;</span>K
                  </kbd>
                </div>
              </form>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2">
                {user && (
                  <>
                    <Link href="/messages" className="relative p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface/50 transition-colors" title="Messages">
                      <Send className="w-4 h-4" />
                    </Link>
                    <Link href="/notifications" className="relative p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface/50 transition-colors" title="Notifications">
                      <Bell className="w-4 h-4" />
                      {notifCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-danger text-[10px] font-bold text-white flex items-center justify-center min-w-[18px] min-h-[18px] px-1">
                          {notifCount > 9 ? "9+" : notifCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                {user ? (
                  <div className="relative" ref={userRef}>
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-surface/50 transition-all border border-transparent hover:border-border/50"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                        <span className="text-accent text-xs font-bold">
                          {initials(user.user_metadata?.full_name, user.email)}
                        </span>
                      </div>
                      <span className="hidden xl:inline text-text-secondary max-w-[120px] truncate">{displayName}</span>
                      <ChevronDown className={`w-3 h-3 text-text-muted transition-transform duration-200 ${userDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {userDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-surface/95 backdrop-blur-xl border border-border/80 rounded-xl shadow-2xl py-2 z-50 origin-top-right animate-in fade-in-0 zoom-in-95 duration-150">
                        <div className="px-4 py-2.5 border-b border-border/50 mb-1">
                          <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
                          <p className="text-xs text-text-muted truncate mt-0.5">{user.email}</p>
                        </div>
                        <Link href="/dashboard" onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors mx-1.5 rounded-lg">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link href="/profile" onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors mx-1.5 rounded-lg">
                          <User className="w-4 h-4" /> Profile
                        </Link>
                        <Link href="/messages" onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors mx-1.5 rounded-lg">
                          <Send className="w-4 h-4" /> Messages
                        </Link>
                        <Link href="/resume" onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors mx-1.5 rounded-lg">
                          <FileText className="w-4 h-4" /> Resume
                        </Link>
                        {isAdmin && (
                          <Link href="/admin" onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors mx-1.5 rounded-lg">
                            <FileText className="w-4 h-4" /> Admin
                          </Link>
                        )}
                        <div className="border-t border-border/50 my-1 mx-3" />
                        <button onClick={signOut}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors w-full text-left mx-1.5 rounded-lg">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link href="/login"
                      className="px-3.5 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface/50">
                      Log in
                    </Link>
                    <Link href="/signup"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-gradient-to-r from-accent to-accent-hover text-bg-primary rounded-lg hover:shadow-glow-btn hover:brightness-110 transition-all">
                      Sign Up
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}
              </div>

              <div className="flex lg:hidden items-center gap-1.5">
                {user ? (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                    <span className="text-accent text-xs font-bold">{initials(user.user_metadata?.full_name, user.email)}</span>
                  </div>
                ) : (
                  <Link href="/signup" className="px-2.5 py-1 text-xs font-semibold bg-accent text-bg-primary rounded-lg transition-colors">
                    Sign Up
                  </Link>
                )}
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center justify-center w-9 h-9 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface/50 transition-colors"
                  aria-label="Toggle menu"
                >
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
        <div className={`absolute top-0 right-0 h-full w-full max-w-sm bg-bg-primary/95 backdrop-blur-2xl border-l border-border/80 shadow-2xl transition-transform duration-300 ease-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}>
          <div className="flex items-center justify-between px-5 h-16 border-b border-border/50">
            <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10">
                <Zap className="w-3.5 h-3.5 text-accent" />
              </div>
              <span className="font-display text-lg font-bold text-text-primary">
                Silicon<span className="text-accent">Path</span>
              </span>
            </Link>
            <button onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center w-9 h-9 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface/50 transition-colors"
              aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto h-[calc(100vh-4rem)] pb-8">
            <div className="px-4 pt-4 pb-2">
              <form onSubmit={(e) => { doSearch(e); setMenuOpen(false); }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search opportunities..."
                    className="w-full pl-10 pr-4 py-2.5 bg-surface/80 border border-border/60 rounded-lg text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent/40 transition-colors" />
                </div>
              </form>
            </div>

            <div className="px-3 py-2 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                const isOpen = openDropdown === item.label;
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      active ? "text-accent bg-accent/10" : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                    }`}
                  >
                    <div className={`flex items-center justify-center w-6 h-6 rounded-md ${active ? "bg-accent/15" : "bg-surface-elevated"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="px-4 mt-4">
              <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-4" />
              {user ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                      <span className="text-accent text-sm font-bold">{initials(user.user_metadata?.full_name, user.email)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">{displayName}</div>
                      <div className="text-xs text-text-muted truncate">{user.email}</div>
                    </div>
                  </div>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface/50 transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link href="/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface/50 transition-colors">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <Link href="/messages" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface/50 transition-colors">
                    <Send className="w-4 h-4" /> Messages
                  </Link>
                  <Link href="/notifications" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface/50 transition-colors">
                    <Bell className="w-4 h-4" /> Notifications
                    {notifCount > 0 && <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto">{notifCount}</span>}
                  </Link>
                  <Link href="/resume" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface/50 transition-colors">
                    <FileText className="w-4 h-4" /> Resume
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface/50 transition-colors">
                      <FileText className="w-4 h-4" /> Admin
                    </Link>
                  )}
                  <button onClick={() => { signOut(); setMenuOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors w-full">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/login" onClick={() => setMenuOpen(false)}
                    className="block text-center px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface/50 transition-colors w-full border border-border/50">
                    Log in
                  </Link>
                  <Link href="/signup" onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-accent-hover text-bg-primary font-semibold rounded-lg px-4 py-2.5 text-sm hover:brightness-110 transition-all w-full">
                    Sign Up <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
