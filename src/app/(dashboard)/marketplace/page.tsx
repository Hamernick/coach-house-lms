import { Metadata } from "next"

import ShoppingBagIcon from "lucide-react/dist/esm/icons/shopping-bag"

import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"
import { MarketplaceClientShell } from "./marketplace-shell"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Marketplace",
}

export default async function MarketplacePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageTutorialButton tutorial="marketplace" />
      <section className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground">
          <ShoppingBagIcon className="h-5 w-5" aria-hidden />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Marketplace</h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Curated tools and services for nonprofits: legal, HR, fundraising, banking, web, social, community,
            research, grants, and more.
          </p>
        </div>
      </section>

      <MarketplaceClientShell />
    </div>
  )
}
