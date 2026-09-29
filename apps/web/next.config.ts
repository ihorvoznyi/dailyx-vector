import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@dailyx/core', '@dailyx/db', '@dailyx/ui'],
  // PGlite loads its WASM and data files from its own package dir at run time.
  serverExternalPackages: ['@electric-sql/pglite'],
};

export default nextConfig;
