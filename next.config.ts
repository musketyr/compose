import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_OPENCLAW_WS_URL: process.env.OPENCLAW_WS_URL || 'ws://localhost:18789',
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
