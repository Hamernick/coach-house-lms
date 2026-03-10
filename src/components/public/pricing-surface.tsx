import { PublicHeader } from "@/components/public/public-header"
import {
  PricingCallToActionSection,
  PricingFeatureBreakdownIntroSection,
  PricingFeatureMatrixSection,
  PricingHeroSection,
  PricingTierCardsSection,
} from "@/components/public/pricing-surface-sections"
import { env } from "@/lib/env"
import { cn } from "@/lib/utils"

type PricingSurfaceProps = {
  embedded?: boolean
}

export async function PricingSurface({ embedded = false }: PricingSurfaceProps = {}) {
  const isEmbedded = embedded
  const hasStripeSecretKey = Boolean(env.STRIPE_SECRET_KEY)
  const canCheckoutOrganization = Boolean(hasStripeSecretKey && env.STRIPE_ORGANIZATION_PRICE_ID)
  const operationsSupportPriceId = env.STRIPE_OPERATIONS_SUPPORT_PRICE_ID ?? null
  const canCheckoutOperationsSupport = Boolean(hasStripeSecretKey && operationsSupportPriceId)

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
        <PricingTierCardsSection
          isEmbedded={isEmbedded}
          hasStripeSecretKey={hasStripeSecretKey}
          canCheckoutOrganization={canCheckoutOrganization}
          canCheckoutOperationsSupport={canCheckoutOperationsSupport}
        />
        <PricingFeatureBreakdownIntroSection />
        <PricingFeatureMatrixSection />
        <PricingCallToActionSection />
      </div>
    </main>
  )
}
