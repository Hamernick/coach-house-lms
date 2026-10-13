import { PublicHeader } from "@/components/public/public-header"
import {
  PricingCallToActionSection,
  PricingFeatureBreakdownIntroSection,
  PricingFeatureMatrixSection,
  PricingHeroSection,
  PricingTierCardsSection,
} from "@/components/public/pricing-surface-sections"
import { cn } from "@/lib/utils"

type PricingSurfaceProps = {
  embedded?: boolean
}

export async function PricingSurface({
  embedded = false,
}: PricingSurfaceProps = {}) {
  const isEmbedded = embedded
  const Root = isEmbedded ? "section" : "main"

  return (
    <Root
      data-public-surface="pricing"
      data-public-pricing-embedded={isEmbedded ? "" : undefined}
      aria-labelledby="pricing-heading"
      className={cn(
        "bg-background relative pt-px [--background:var(--surface)]",
        isEmbedded ? "min-h-full" : "min-h-screen"
      )}
    >
      {isEmbedded ? null : <PublicHeader />}
      <div
        className={cn(
          "mx-auto flex w-[min(1000px,92%)] flex-col gap-16 pb-16 lg:pb-24",
          isEmbedded ? "pt-20 sm:pt-24" : "pt-24 sm:pt-28"
        )}
      >
        <PricingHeroSection headingLevel={isEmbedded ? "h2" : "h1"} />
        <PricingTierCardsSection />
        <PricingFeatureBreakdownIntroSection />
        <PricingFeatureMatrixSection />
        <PricingCallToActionSection />
      </div>
    </Root>
  )
}
