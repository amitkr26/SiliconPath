import { MetadataRoute } from "next";
import { FALLBACK_TRACKS } from "@/lib/academy/fallback";

const SITE_URL = "https://siliconpath.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/academy`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Academy track + day + assessment pages
  for (const track of FALLBACK_TRACKS) {
    urls.push({
      url: `${SITE_URL}/academy/${track.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (let d = 1; d <= track.estimated_days; d++) {
      urls.push({
        url: `${SITE_URL}/academy/${track.slug}/day/${d}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
    urls.push({
      url: `${SITE_URL}/academy/${track.slug}/assessment`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return urls;
}
