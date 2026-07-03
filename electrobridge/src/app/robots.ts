import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    ],
    sitemap: "https://electrobridge.vercel.app/sitemap.xml",
    host: "https://electrobridge.vercel.app",
  };
}
