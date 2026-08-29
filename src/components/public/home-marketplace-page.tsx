import { HomeMarketplaceCollectSection } from "@/components/public/home-marketplace-collect-section"
import { HomeMarketplaceHeader } from "@/components/public/home-marketplace-header"
import { HomeMarketplaceHero } from "@/components/public/home-marketplace-hero"
import { HomeMarketplaceMotion } from "@/components/public/home-marketplace-motion"

export function HomeMarketplacePage() {
  return (
    <div
      data-shell-root=""
      data-public-marketplace-home=""
      className="bg-background text-foreground flex h-svh min-h-0 flex-col overflow-hidden"
    >
      <a
        href="#marketplace-main"
        className="bg-background text-foreground focus-visible:ring-ring fixed top-2 left-2 z-[100] -translate-y-20 rounded-md px-3 py-2 text-sm shadow-md focus-visible:translate-y-0 focus-visible:ring-2 focus-visible:outline-none"
      >
        Skip to content
      </a>
      <HomeMarketplaceHeader />

      <main
        id="marketplace-main"
        tabIndex={-1}
        className="border-border mx-3 mb-3 min-h-0 flex-1 overflow-hidden rounded-[28px] border bg-[#006bff] sm:mx-5 sm:mb-5"
      >
        <HomeMarketplaceMotion>
          <HomeMarketplaceHero />
          <HomeMarketplaceCollectSection />
        </HomeMarketplaceMotion>
      </main>
    </div>
  )
}
