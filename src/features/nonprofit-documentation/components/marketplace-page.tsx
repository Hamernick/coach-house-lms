import { MARKETPLACE_RESOURCES } from "../lib/marketplace-resources"
import { cn } from "@/lib/utils"
import density from "./documentation-density.module.css"
import {
  DocumentationJsonLd,
  DocumentationSurface,
} from "./documentation-surface"
import { MarketplaceDirectory } from "./marketplace/marketplace-directory"

export function MarketplacePage() {
  const pageUrl = "https://coachhouse.app/documentation/marketplace"
  return (
    <DocumentationSurface>
      <DocumentationJsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Nonprofit Marketplace",
          description:
            "Nonprofit tools, offers, and resource banks, with practical guides to getting started.",
          url: pageUrl,
          dateModified: "2026-09-04",
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Documentation",
                item: "https://coachhouse.app/documentation",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Marketplace",
                item: pageUrl,
              },
            ],
          },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: MARKETPLACE_RESOURCES.length,
            itemListElement: MARKETPLACE_RESOURCES.map((resource, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: resource.name,
              url: `${pageUrl}/${resource.id}`,
            })),
          },
        }}
      />
      <main
        id="documentation-content"
        className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
      >
        <header className={cn(density.heading, "mb-8")}>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Marketplace
          </h1>
          <p className="text-muted-foreground max-w-2xl text-base sm:text-lg">
            Compare tools, offers, and resource banks for your nonprofit.
          </p>
        </header>
        <MarketplaceDirectory />
        <footer
          id="method"
          className="text-muted-foreground mt-6 scroll-mt-24 border-t pt-4 text-xs leading-5"
        >
          <p>
            Source-backed listings, with offer terms and review dates on each
            detail page. Inclusion is not an endorsement. Confirm current terms
            with the provider before applying or purchasing.
          </p>
        </footer>
      </main>
    </DocumentationSurface>
  )
}
