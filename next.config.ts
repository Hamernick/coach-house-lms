import type { NextConfig } from "next"
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer"

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : undefined

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {},
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{member}}",
      skipDefaultConversion: true,
    },
  },
  webpack(config, options) {
    if (process.env.ANALYZE) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          reportFilename: options.isServer ? "analyze-server.html" : "analyze-client.html",
          openAnalyzer: false,
        }),
      )
    }
    // Reduce cache serialization warnings in CI by disabling filesystem cache
    if (process.env.CI) {
      config.cache = false
    }
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Allow images served from Supabase Storage buckets for this project
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/**",
            },
          ]
        : []),
    ],
  },
}

export default nextConfig
