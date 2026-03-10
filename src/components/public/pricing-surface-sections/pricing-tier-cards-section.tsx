import Link from "next/link"

import { PLATFORM_TIERS } from "@/components/public/pricing-surface-data"
import { TierFeatures } from "@/components/public/pricing-surface-sections/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type PricingTierCardsSectionProps = {
  isEmbedded: boolean
}

const WORKSPACE_ONBOARDING_PRICING_REDIRECT =
  "/workspace?onboarding_flow=1&source=onboarding_pricing"

function buildBuilderSignUpHref(tierId: "organization" | "operations") {
  const params = new URLSearchParams({
    plan: "organization",
    redirect: WORKSPACE_ONBOARDING_PRICING_REDIRECT,
  })
  if (tierId === "operations") {
    params.set("tier", "operations")
  }
  return `/sign-up?${params.toString()}`
}

export function PricingTierCardsSection({
  isEmbedded,
}: PricingTierCardsSectionProps) {
  return (
    <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {PLATFORM_TIERS.map((tier) => {
        const isFormation = tier.id === "formation"
        const isMailtoCta = tier.ctaHref.startsWith("mailto:")
        const isPaidTier = tier.id === "organization" || tier.id === "operations"
        const ctaVariant = isFormation || tier.featured ? "default" : "secondary"
        const signUpHref = isFormation
          ? "/sign-up?plan=individual"
          : tier.id === "operations"
            ? buildBuilderSignUpHref("operations")
            : buildBuilderSignUpHref("organization")

        return (
          <Card
            key={tier.id}
            className={cn(
              "flex h-full flex-col rounded-3xl border border-border/70",
              tier.featured && "border-primary/30 ring-1 ring-primary/15 shadow-md",
            )}
          >
            <CardHeader className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tier.eyebrow}</p>
                {tier.badge ? (
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {tier.badge}
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-3">
                <CardTitle className="min-h-10 text-3xl font-semibold tracking-tight">{tier.title}</CardTitle>
                <div className="flex min-h-11 items-end gap-2">
                  <span className="text-4xl font-semibold tracking-tight">{tier.priceLine}</span>
                  {tier.priceNote ? <span className="pb-1 text-sm font-medium text-muted-foreground">{tier.priceNote}</span> : null}
                </div>
                <CardDescription className="min-h-20 text-sm leading-relaxed text-muted-foreground">{tier.subtitle}</CardDescription>
              </div>

              {isEmbedded || isPaidTier ? (
                <Button asChild className="w-full rounded-xl" variant={ctaVariant}>
                  <Link href={signUpHref} className="flex items-center justify-center">
                    {tier.ctaLabel}
                  </Link>
                </Button>
              ) : (
                <Button asChild className="w-full rounded-xl" variant={ctaVariant}>
                  {isMailtoCta ? (
                    <a href={tier.ctaHref} className="flex items-center justify-center">
                      {tier.ctaLabel}
                    </a>
                  ) : (
                    <Link href={tier.ctaHref} className="flex items-center justify-center">
                      {tier.ctaLabel}
                    </Link>
                  )}
                </Button>
              )}
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-5 px-6 pb-6">
              <div className="h-px w-full bg-border/70" aria-hidden />
              <TierFeatures heading={tier.featureHeading} items={tier.features} tone="muted" />
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
