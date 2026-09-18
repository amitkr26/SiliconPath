"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Megaphone,
  Newspaper,
  Users,
  Activity,
  Radio,
  ExternalLink,
  LogOut,
  Cpu,
  UserCheck,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";

interface AdminNavProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function AdminNav({ title, subtitle, icon: Icon }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_password");
    toast.info("Signed out of Admin Console");
    router.push("/admin");
  };

  const navLinks = [
    { href: "/admin", label: "Console", icon: Cpu },
    { href: "/admin/companies", label: "Companies", icon: Building2 },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { href: "/admin/add-news", label: "News", icon: Newspaper },
    { href: "/admin/talent-pool", label: "Talent", icon: UserCheck },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/performance", label: "Performance", icon: Activity },
    { href: "/admin/scrape-health", label: "Scrapers", icon: Radio },
    { href: "/admin/seo", label: "SEO", icon: Search },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Back to Admin & Page Identity */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg border border-slate-700/50 transition-colors"
              title="Return to Main Admin Console"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Console</span>
            </Link>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              {Icon && (
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
              )}
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white leading-none">{title}</h1>
                {subtitle && <p className="text-[11px] text-slate-400 mt-0.5 leading-none">{subtitle}</p>}
              </div>
            </div>
          </div>

          {/* Right: Hub Switcher & Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden md:flex items-center gap-1 overflow-x-auto py-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const LinkIcon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="h-5 w-px bg-slate-800 hidden md:block" />

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Open Public Site"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Sign Out of Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
