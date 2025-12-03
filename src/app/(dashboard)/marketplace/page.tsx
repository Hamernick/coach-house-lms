import { Metadata } from "next"

import { MarketplaceClientShell } from "./marketplace-shell"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Marketplace",
}

export default async function MarketplacePage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-6 lg:px-8">
      <section className="text-center mt-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Marketplace</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          Curated tools and services for nonprofits: legal, HR, fundraising, banking, web, social, community,
          research, grants, and more.
        </p>
      </section>

      <MarketplaceClientShell />
    </div>
  )
}
