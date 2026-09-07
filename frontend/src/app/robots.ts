import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/dashboard",
          "/saved",
          "/applications",
          "/messages",
          "/network",
          "/feed",
          "/employer",
        ],
      },
    ],
    sitemap: "https://berojgardegreewala.vercel.app/sitemap.xml",
    host: "https://berojgardegreewala.vercel.app",
  };
}
