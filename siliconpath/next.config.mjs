/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Lint is a style signal, not a build-correctness gate. It runs as its own
    // step in CI (non-blocking). Do NOT let lint errors fail the production build.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Real type errors MUST still fail the build. Do not flip this to true.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
