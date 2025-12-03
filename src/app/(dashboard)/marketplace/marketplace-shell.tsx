"use client"

import dynamic from "next/dynamic"

const MarketplaceClient = dynamic(
  () => import("./ui/marketplace-client").then((mod) => mod.MarketplaceClient),
  {
    ssr: false,
    loading: () => (
      <div className="mt-6 text-sm text-muted-foreground">Loading marketplace…</div>
    ),
  },
)

export function MarketplaceClientShell() {
  return <MarketplaceClient />
}

