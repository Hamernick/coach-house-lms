import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  webpack(config) {
    // Reduce cache serialization warnings in CI by disabling filesystem cache
    // This avoids Webpack PackFileCacheStrategy warning about big string serialization
    if (process.env.CI) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(config as any).cache = false
    }
    return config
  },
}

export default nextConfig
