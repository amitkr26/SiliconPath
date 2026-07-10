"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Cpu } from "lucide-react";

const NAV_LINKS = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/academy", label: "Academy" },
  { href: "/news", label: "News" },
  { href: "/organizations", label: "Organizations" },
  { href: "/resources", label: "Resources" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border-subtle bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-15 max-w-content items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-extrabold text-lg text-text">
          <Cpu className="h-6 w-6 text-primary" />
          SiliconPath
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    active ? "text-primary font-semibold" : "text-text-secondary hover:text-text"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised hover:text-text">
            Log in
          </Link>
          <Link href="/signup" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
            Sign Up
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-raised"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-border-subtle bg-surface md:hidden">
          <ul className="flex flex-col px-4 py-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-text-secondary hover:bg-surface-raised hover:text-text"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex gap-2 border-t border-border-subtle pt-3">
              <Link href="/login" onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-text">
                Log in
              </Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white">
                Sign Up
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
