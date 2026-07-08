/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Server Actions are enabled by default in Next 14; kept explicit for clarity.
  },
};

export default nextConfig;
