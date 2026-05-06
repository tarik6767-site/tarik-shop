import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eaaauirynzsmagthqsji.supabase.co',
      },
    ],
  },
}

export default nextConfig
