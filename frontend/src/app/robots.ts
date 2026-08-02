import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    ],
    sitemap: "https://siliconpath.vercel.app/sitemap.xml",
    host: "https://siliconpath.vercel.app",
  };
}
