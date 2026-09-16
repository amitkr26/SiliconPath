/**
 * Centralized social media configuration for BerojgarDegreeWala.
 * Single source of truth for all social profile links.
 *
 * ponytail: Do NOT scatter these URLs in components. Import from here.
 */

export interface SocialLink {
  platform: string;
  label: string;
  /** Full canonical profile URL */
  url: string;
  /** Display handle (for aria-labels) */
  handle: string;
  /** Hover/focus color (Tailwind class fragment) */
  hoverColor: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: "linkedin",
    label: "LinkedIn",
    url: "https://www.linkedin.com/in/rankrseo/",
    handle: "rankrseo",
    hoverColor: "blue-600",
  },
  {
    platform: "instagram",
    label: "Instagram",
    url: "https://www.instagram.com/rankrseo",
    handle: "rankrseo",
    hoverColor: "pink-600",
  },
  {
    platform: "instagram-academy",
    label: "Instagram — Berojgar Academy",
    url: "https://www.instagram.com/berojgaracademy/",
    handle: "berojgaracademy",
    hoverColor: "pink-600",
  },
  {
    platform: "youtube",
    label: "YouTube",
    url: "https://www.youtube.com/@rankrseo",
    handle: "@rankrseo",
    hoverColor: "red-600",
  },
  {
    platform: "x",
    label: "X (Twitter)",
    url: "https://x.com/rankrseo",
    handle: "@rankrseo",
    hoverColor: "slate-900",
  },
  {
    platform: "facebook",
    label: "Facebook",
    url: "https://www.facebook.com/RankrSEOs",
    handle: "RankrSEOs",
    hoverColor: "blue-700",
  },
  {
    platform: "pinterest",
    label: "Pinterest",
    url: "https://in.pinterest.com/rankrseo/",
    handle: "rankrseo",
    hoverColor: "red-700",
  },
  {
    platform: "reddit",
    label: "Reddit",
    url: "https://www.reddit.com/user/rankrseo/",
    handle: "u/rankrseo",
    hoverColor: "orange-600",
  },
];

/**
 * Subset for footer display (skip secondary Instagram for compactness).
 * The full list is used on the About page.
 */
export const FOOTER_SOCIAL_LINKS = SOCIAL_LINKS.filter(
  (l) => l.platform !== "instagram-academy"
);

/**
 * sameAs URLs for schema.org Organization markup.
 */
export const ORGANIZATION_SAME_AS = SOCIAL_LINKS.map((l) => l.url);
