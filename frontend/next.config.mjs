/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  compress: true,
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/auth/signin",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/community",
        destination: "/feed",
        permanent: true,
      },
      {
        source: "/community/:path*",
        destination: "/feed",
        permanent: true,
      },
      {
        source: "/chat",
        destination: "/ask-ai",
        permanent: true,
      },
      {
        source: "/chat/:path*",
        destination: "/ask-ai",
        permanent: true,
      },
      {
        source: "/post-job",
        destination: "/employer/post-job",
        permanent: true,
      },
      {
        source: "/employers",
        destination: "/employer",
        permanent: true,
      },
      {
        source: "/employers/:path*",
        destination: "/employer/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), browsing-topics=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
