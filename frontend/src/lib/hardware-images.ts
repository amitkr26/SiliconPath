/**
 * Deep-Tech Hardware Image & Domain Badge Resolver
 * Maps real semiconductor, VLSI, embedded, space, and hardware stories
 * to photorealistic authentic assets and domain badges.
 */

export const HARDWARE_HERO_IMAGES = {
  semiconductor: "/images/hardware/semiconductor-cleanroom-fab.jpg",
  vlsi: "/images/hardware/vlsi-microchip-die.jpg",
  embedded: "/images/hardware/embedded-systems-pcb.jpg",
  spaceDefence: "/images/hardware/satellite-radar-avionics.jpg",
  photonics: "/images/hardware/photonics-quantum-lab.jpg",
  workbench: "/images/hardware/hardware-lab-workbench.jpg",
};

export interface NewsBadge {
  label: string;
  bgClass: string;
  badgeClass: string;
}

/**
 * Resolves an authentic, photorealistic image for a hardware article.
 * If the article has a real publisher image URL, it uses it.
 * Otherwise, maps intelligently to the article's hardware domain.
 */
export function resolveHardwareNewsImage(
  article: { title?: string; tags?: string[]; image_url?: string | null; summary?: string | null },
  fallbackIndex = 0
): string {
  // If publisher provided an image URL, verify it's a real valid URL
  if (
    article.image_url &&
    typeof article.image_url === "string" &&
    article.image_url.trim().length > 0 &&
    !article.image_url.includes("placeholder") &&
    !article.image_url.includes("news-team-study") &&
    !article.image_url.includes("news-campus-") &&
    !article.image_url.includes("undefined")
  ) {
    return article.image_url.trim();
  }

  const title = (article.title || "").toLowerCase();
  const summary = (article.summary || "").toLowerCase();
  const tagsStr = (article.tags || []).join(" ").toLowerCase();
  const text = `${title} ${summary} ${tagsStr}`;

  if (text.match(/semi|fab|wafer|foundry|litho|tsmc|intel|micron|smic|packaging|cleanroom|silicon/)) {
    return HARDWARE_HERO_IMAGES.semiconductor;
  }
  if (text.match(/vlsi|asic|die|chip|eda|cadence|synopsys|processor|risc-v|arm|gpu|cpu|tapeout|cmos|transistor/)) {
    return HARDWARE_HERO_IMAGES.vlsi;
  }
  if (text.match(/embedded|mcu|microcontroller|firmware|iot|sensor|stm32|rtos|arduino|raspberry|esp32/)) {
    return HARDWARE_HERO_IMAGES.embedded;
  }
  if (text.match(/space|defence|defense|isro|drdo|satellite|radar|avionics|aerospace|payload|missile|antenn/)) {
    return HARDWARE_HERO_IMAGES.spaceDefence;
  }
  if (text.match(/quantum|photonic|optics|laser|physics|fiber|optical|telecom|5g|wireless|terahertz/)) {
    return HARDWARE_HERO_IMAGES.photonics;
  }
  if (text.match(/circuit|analog|rf|power|oscilloscope|test|bench|signal|voltage|pcb|power electronic|inverter/)) {
    return HARDWARE_HERO_IMAGES.workbench;
  }

  const cycle = [
    HARDWARE_HERO_IMAGES.semiconductor,
    HARDWARE_HERO_IMAGES.vlsi,
    HARDWARE_HERO_IMAGES.embedded,
    HARDWARE_HERO_IMAGES.spaceDefence,
    HARDWARE_HERO_IMAGES.photonics,
    HARDWARE_HERO_IMAGES.workbench,
  ];

  return cycle[Math.abs(fallbackIndex) % cycle.length];
}

/**
 * Resolves an authentic hardware domain badge (replaces dummy "CAREER TIPS" / "GUIDE" / "ANNOUNCEMENT")
 */
export function resolveNewsDomainBadge(article: {
  title?: string;
  tags?: string[];
  summary?: string | null;
}): NewsBadge {
  const title = (article.title || "").toLowerCase();
  const summary = (article.summary || "").toLowerCase();
  const tagsStr = (article.tags || []).join(" ").toLowerCase();
  const text = `${title} ${summary} ${tagsStr}`;

  if (text.match(/semi|fab|wafer|foundry|litho|tsmc|intel|micron|india semiconductor/)) {
    return {
      label: "SEMICONDUCTOR",
      bgClass: "bg-blue-600",
      badgeClass: "bg-blue-600 text-white",
    };
  }
  if (text.match(/vlsi|asic|die|chip|eda|cadence|synopsys|risc-v|tapeout|processor/)) {
    return {
      label: "VLSI & CHIP DESIGN",
      bgClass: "bg-indigo-600",
      badgeClass: "bg-indigo-600 text-white",
    };
  }
  if (text.match(/embedded|mcu|microcontroller|firmware|iot|sensor|stm32|rtos/)) {
    return {
      label: "EMBEDDED SYSTEMS",
      bgClass: "bg-emerald-600",
      badgeClass: "bg-emerald-600 text-white",
    };
  }
  if (text.match(/space|defence|defense|isro|drdo|satellite|radar|avionics|aerospace/)) {
    return {
      label: "DEFENCE & SPACE",
      bgClass: "bg-purple-600",
      badgeClass: "bg-purple-600 text-white",
    };
  }
  if (text.match(/5g|telecom|wireless|rf|antenna|mno/)) {
    return {
      label: "TELECOM & RF",
      bgClass: "bg-teal-600",
      badgeClass: "bg-teal-600 text-white",
    };
  }
  if (text.match(/quantum|photonic|optics|laser|physics|nanotech|research|ieee/)) {
    return {
      label: "DEEP-TECH RESEARCH",
      bgClass: "bg-amber-600",
      badgeClass: "bg-amber-600 text-white",
    };
  }
  if (text.match(/power|inverter|battery|ev|energy/)) {
    return {
      label: "POWER ELECTRONICS",
      bgClass: "bg-rose-600",
      badgeClass: "bg-rose-600 text-white",
    };
  }

  // Fallback to primary tag if available
  const primaryTag = article.tags && article.tags.length > 0 ? article.tags[0].toUpperCase() : "HARDWARE INTELLIGENCE";
  return {
    label: primaryTag,
    bgClass: "bg-slate-800",
    badgeClass: "bg-slate-800 text-white",
  };
}
