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

export async function PricingSurface({ embedded = false }: PricingSurfaceProps = {}) {
  const isEmbedded = embedded

  return (
    <main
      data-public-surface="pricing"
      className={cn(
        "relative bg-background pt-px [--background:var(--surface)]",
        isEmbedded ? "min-h-full" : "min-h-screen",
      )}
    >
      {isEmbedded ? null : <PublicHeader />}
      <div
        className={cn(
          "mx-auto flex w-[min(1000px,92%)] flex-col gap-16 pb-16 lg:pb-24",
          isEmbedded ? "pt-8 sm:pt-10" : "pt-24 sm:pt-28",
        )}
      >
        <PricingHeroSection />
        <PricingTierCardsSection isEmbedded={isEmbedded} />
        <PricingFeatureBreakdownIntroSection />
        <PricingFeatureMatrixSection />
        <PricingCallToActionSection />
      </div>
    </main>
  )
}
