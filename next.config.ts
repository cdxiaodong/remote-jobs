import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
