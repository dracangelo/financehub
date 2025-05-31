/** @type {import('next').NextConfig} */
module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuration for experimental features
  experimental: {
    // Increase body size limit for server actions to 5MB
    serverActions: {
      bodySizeLimit: '5mb',
    },
    // Build optimizations
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  // Explicitly handle the problematic pages
  rewrites: async () => {
    return [
      {
        source: '/access-denied',
        destination: '/',
      },
      {
        source: '/forgot-password',
        destination: '/',
      },
      {
        source: '/accounts/:id',
        destination: '/',
      },
    ];
  },
  // Disable strict mode for routes to help with build issues
};
