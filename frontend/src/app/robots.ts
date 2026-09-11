import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
        ],
      },
    ],
    sitemap: "https://siliconpath.vercel.app/sitemap.xml",
    host: "https://siliconpath.vercel.app",
  };
}
