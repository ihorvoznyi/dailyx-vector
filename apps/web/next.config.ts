import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@dailyx/core', '@dailyx/db', '@dailyx/ui'],
};

export default nextConfig;
