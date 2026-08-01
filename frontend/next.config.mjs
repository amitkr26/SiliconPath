/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  swcMinify: true,
  compress: true,
  reactStrictMode: true,
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
        source: "/opportunities/:uuid(\\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\b)",
        destination: "/opportunities",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
