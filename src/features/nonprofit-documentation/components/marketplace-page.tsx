import { MARKETPLACE_RESOURCES } from "../lib/marketplace-resources"
import {
  DocumentationJsonLd,
  DocumentationSurface,
} from "./documentation-surface"
import { MarketplaceDirectory } from "./marketplace/marketplace-directory"
import {
  MarketplacePeople,
  type MarketplacePeopleData,
} from "./marketplace/marketplace-people"
import { MarketplaceViews } from "./marketplace/marketplace-views"

export function MarketplacePage({
  view = "resources",
  peopleDirectory,
}: {
  view?: "resources" | "people"
  peopleDirectory: MarketplacePeopleData
}) {
  const pageUrl = "https://coachhouse.app/documentation/marketplace"
  return (
    <DocumentationSurface>
      <DocumentationJsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Nonprofit Marketplace",
          description:
            "Nonprofit tools, offers, resource banks, and people, with practical guides to getting started.",
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
        className="mx-auto w-full max-w-[1200px] px-5 py-8 sm:px-8 lg:px-12"
      >
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
            Useful tools, nonprofit offers, and people to help you put your
            plans to work.
          </p>
        </header>
        <MarketplaceViews
          view={view}
          resources={<MarketplaceDirectory />}
          people={<MarketplacePeople directory={peopleDirectory} />}
        />
        <footer
          id="method"
          className="text-muted-foreground mt-10 scroll-mt-24 border-t pt-5 text-xs leading-5"
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
