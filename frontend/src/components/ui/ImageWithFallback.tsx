"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Building2, Newspaper, User } from "lucide-react";

export interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  name?: string;
  fallbackName?: string;
  variant?: "avatar" | "monogram" | "logo" | "editorial" | "news";
  fallbackType?: "avatar" | "monogram" | "logo" | "editorial" | "news";
  width?: number;
  height?: number;
  size?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  editorialMeta?: {
    sourceName?: string;
    category?: string;
    date?: string;
  };
}

// Deterministic, harmonious color pairs (background + text) for monograms
const MONOGRAM_PALETTES = [
  { bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
  { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  { bg: "bg-teal-50 border-teal-200", text: "text-teal-700" },
  { bg: "bg-amber-50 border-amber-200", text: "text-amber-800" },
  { bg: "bg-rose-50 border-rose-200", text: "text-rose-700" },
  { bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
  { bg: "bg-cyan-50 border-cyan-200", text: "text-cyan-800" },
];

/**
 * Derives 1-2 uppercase letters deterministically from an organization or person name.
 * e.g., "Indian Space Research Organisation" -> "IS", "Qualcomm India" -> "QI", "Intel" -> "IN"
 */
export function getDeterministicInitials(name?: string): string {
  if (!name || !name.trim()) return "?";
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Derives a deterministic color palette based on string hash.
 */
export function getDeterministicPalette(name?: string) {
  if (!name) return MONOGRAM_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % MONOGRAM_PALETTES.length;
  return MONOGRAM_PALETTES[index];
}

export function ImageWithFallback({
  src,
  alt,
  name,
  fallbackName,
  variant = "logo",
  fallbackType,
  width,
  height,
  size,
  fill,
  className = "",
  priority = false,
  editorialMeta,
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  const resolvedVariant = fallbackType || variant;
  const resolvedName = fallbackName || name;

  // Derive initials and colors
  const initials = useMemo(() => getDeterministicInitials(resolvedName || alt), [resolvedName, alt]);
  const palette = useMemo(() => getDeterministicPalette(resolvedName || alt), [resolvedName, alt]);

  const resolvedWidth = width || size;
  const resolvedHeight = height || size;

  const isValidUrl = Boolean(
    src &&
    typeof src === "string" &&
    src.trim().length > 0 &&
    (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/"))
  );

  // 1. Editorial News Fallback Banner
  if ((resolvedVariant === "editorial" || resolvedVariant === "news") && (!isValidUrl || hasError)) {
    return (
      <div
        className={`w-full h-full min-h-[140px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 flex flex-col justify-between select-none relative overflow-hidden ${className}`}
        role="img"
        aria-label={alt || "Editorial News Article"}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:12px_12px]" />
        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 backdrop-blur-xs text-[10px] font-bold text-blue-300 border border-white/10">
            <Newspaper className="w-3 h-3 text-blue-400" />
            {editorialMeta?.sourceName || resolvedName || "Semiconductor Editorial"}
          </span>
          {editorialMeta?.category && (
            <span className="text-[10px] font-semibold text-slate-400">
              {editorialMeta.category}
            </span>
          )}
        </div>

        <div className="relative z-10 my-auto py-2">
          <div className="text-xl font-black text-slate-100 tracking-tight leading-snug line-clamp-2">
            {alt || resolvedName || "Semiconductor Engineering Report"}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/10">
          <span className="font-semibold text-blue-400">BerojgarDegreeWala Editorial</span>
          {editorialMeta?.date && <span>{editorialMeta.date}</span>}
        </div>
      </div>
    );
  }

  // 2. Organization Monogram / Compact Fallback
  if (!isValidUrl || hasError) {
    if (resolvedVariant === "avatar") {
      return (
        <div
          className={`flex items-center justify-center rounded-full border ${palette.bg} ${palette.text} font-bold text-xs select-none ${fill ? "w-full h-full" : ""} ${className}`}
          style={{ width: !fill && resolvedWidth ? `${resolvedWidth}px` : undefined, height: !fill && resolvedHeight ? `${resolvedHeight}px` : undefined }}
          role="img"
          aria-label={alt || resolvedName || "User avatar"}
        >
          {initials !== "?" ? (
            <span>{initials}</span>
          ) : (
            <User className="w-4 h-4 opacity-70" />
          )}
        </div>
      );
    }

    // Default logo / monogram fallback
    return (
      <div
        className={`flex items-center justify-center rounded-lg border ${palette.bg} ${palette.text} font-bold text-xs select-none ${fill ? "w-full h-full" : ""} ${className}`}
        style={{ width: !fill && resolvedWidth ? `${resolvedWidth}px` : undefined, height: !fill && resolvedHeight ? `${resolvedHeight}px` : undefined }}
        role="img"
        aria-label={alt || resolvedName || "Organization monogram"}
      >
        {initials !== "?" ? (
          <span>{initials}</span>
        ) : (
          <Building2 className="w-4 h-4 opacity-70" />
        )}
      </div>
    );
  }

  // 3. Render Valid Image
  // Using unoptimized if it's an external URL to prevent Next.js image proxy crashes on arbitrary domains
  const isInternal = src!.startsWith("/");

  if (fill) {
    return (
      <Image
        src={src!}
        alt={alt || resolvedName || "Image"}
        fill
        sizes="(max-width: 768px) 100vw, 300px"
        className={className}
        priority={priority}
        unoptimized={!isInternal}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <Image
      src={src!}
      alt={alt || resolvedName || "Image"}
      width={resolvedWidth || 48}
      height={resolvedHeight || 48}
      className={className}
      priority={priority}
      unoptimized={!isInternal}
      onError={() => setHasError(true)}
    />
  );
}

export default ImageWithFallback;
