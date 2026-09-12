/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  compress: true,
  reactStrictMode: true,
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "aqauempuwmbizqoaolop.supabase.co" },
      { protocol: "https", hostname: "jbqjipwanfsxyqkfrrpx.supabase.co" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "media.licdn.com" },
      { protocol: "https", hostname: "unavatar.io" },
      { protocol: "https", hostname: "*.isro.gov.in" },
      { protocol: "https", hostname: "*.drdo.gov.in" },
      { protocol: "https", hostname: "*.csir.res.in" },
      { protocol: "https", hostname: "*.iitb.ac.in" },
      { protocol: "https", hostname: "*.iitm.ac.in" },
      { protocol: "https", hostname: "*.iisc.ac.in" },
      { protocol: "https", hostname: "*.nic.in" },
      { protocol: "https", hostname: "semiengineering.com" },
      { protocol: "https", hostname: "spectrum.ieee.org" },
      { protocol: "https", hostname: "www.eetimes.com" },
      { protocol: "https", hostname: "www.electronicsweekly.com" },
      { protocol: "https", hostname: "theelectronicsmedia.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
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
