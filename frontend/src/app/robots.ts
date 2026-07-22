import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    ],
    sitemap: "https://berojgardegreewala.vercel.app/sitemap.xml",
    host: "https://berojgardegreewala.vercel.app",
  };
}
