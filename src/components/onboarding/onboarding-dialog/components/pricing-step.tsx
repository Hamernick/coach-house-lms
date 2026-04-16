"use client"

import { useSearchParams } from "next/navigation"

import { getCheckoutErrorMessage } from "@/components/paywall/paywall-overlay/config"
import { PLATFORM_TIERS } from "@/components/public/pricing-surface-data"
import { TierFeatures } from "@/components/public/pricing-surface-sections/shared"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PricingPlanTier } from "@/lib/billing/plan-tier"
import { cn } from "@/lib/utils"

type PricingStepProps = {
  step: number
  attemptedStep: number | null
  errors: Record<string, string>
  currentPlanTier: PricingPlanTier
  checkoutReturnTo: string
  onboardingMode: "full" | "post_signup_access" | "workspace_setup"
  submitting: boolean
}

const BUILDER_TIER_IDS = new Set(["organization", "operations"])

function splitTierEyebrow(eyebrow: string) {
  const match = eyebrow.match(/^(.*?)(\s*\(.*\))$/)
  if (!match) {
    return {
      primary: eyebrow,
      secondary: null,
    }
  }

  return {
    primary: match[1]?.trim() ?? eyebrow,
    secondary: match[2]?.trim() ?? null,
  }
}

function buildCheckoutHref({
  tierId,
  checkoutReturnTo,
}: {
  tierId: "organization" | "operations"
  checkoutReturnTo: string
}) {
  const params = new URLSearchParams({
    source: "onboarding",
    context: "onboarding_builder",
    redirect: checkoutReturnTo,
    cancel: checkoutReturnTo,
  })
  params.set("plan", tierId === "operations" ? "operations_support" : "organization")
  return `/api/stripe/checkout?${params.toString()}`
}

export function PricingStep({
  step,
  attemptedStep,
  errors,
  currentPlanTier,
  checkoutReturnTo,
  onboardingMode,
  submitting,
}: PricingStepProps) {
  const searchParams = useSearchParams()
  const builderTiers = PLATFORM_TIERS.filter((tier) => BUILDER_TIER_IDS.has(tier.id))
  const checkoutErrorCode = searchParams.get("checkout_error")
  const checkoutErrorDetail = searchParams.get("checkout_detail")
  const checkoutErrorDebug = searchParams.get("checkout_debug")
  const checkoutErrorMessage = getCheckoutErrorMessage(checkoutErrorCode)
  const showManualPaidContinue = onboardingMode === "post_signup_access"

  return (
    <div className="space-y-4 py-4 sm:space-y-5 sm:py-5" data-onboarding-step-id="pricing">
      <div className="rounded-2xl border border-border/70 bg-muted/25 p-3.5 sm:p-4">
        <p className="text-sm font-medium text-foreground">
          Want to build your own organization?
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Choose a builder plan to unlock organization creation, workspace setup,
          teammate access, and the accelerator. You can go back and choose a
          free member journey if you only want the internal map experience.
        </p>
      </div>

      {checkoutErrorMessage ? (
        <Alert className="rounded-2xl border-amber-300/70 bg-amber-50/80 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          <AlertDescription>
            <p>{checkoutErrorMessage}</p>
            {checkoutErrorDetail || checkoutErrorDebug ? (
              <p className="mt-1 text-xs opacity-80">
                {checkoutErrorDetail ? `Reason: ${checkoutErrorDetail}. ` : ""}
                {checkoutErrorDebug ? `Ref: ${checkoutErrorDebug}` : ""}
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        {builderTiers.map((tier) => {
          const eyebrow = splitTierEyebrow(tier.eyebrow)
          const isCurrentTier =
            (tier.id === "organization" && currentPlanTier === "organization") ||
            (tier.id === "operations" && currentPlanTier === "operations_support")
          const checkoutHref = buildCheckoutHref({
            tierId: tier.id === "operations" ? "operations" : "organization",
            checkoutReturnTo,
          })

          return (
            <Card
              key={tier.id}
              className={cn(
                "rounded-[22px] border border-border/70 shadow-none sm:rounded-[26px]",
                tier.featured && "border-primary/35 ring-1 ring-primary/10",
                isCurrentTier && "border-emerald-500/45 bg-emerald-500/[0.06]",
              )}
            >
              <CardHeader className="space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span className="block">{eyebrow.primary}</span>
                      {eyebrow.secondary ? (
                        <span className="mt-0.5 block">{eyebrow.secondary}</span>
                      ) : null}
                    </p>
                    <CardTitle className="mt-2 text-xl sm:text-2xl">{tier.title}</CardTitle>
                  </div>
                  {isCurrentTier ? (
                    <Badge className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      Current plan
                    </Badge>
                  ) : tier.badge ? (
                    <Badge variant="secondary" className="rounded-full">
                      {tier.badge}
                    </Badge>
                  ) : null}
                </div>

                <div className="flex items-end gap-2">
                  <span className="text-3xl font-semibold tracking-tight sm:text-4xl">{tier.priceLine}</span>
                  {tier.priceNote ? (
                    <span className="pb-1 text-sm text-muted-foreground">{tier.priceNote}</span>
                  ) : null}
                </div>

                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  {tier.subtitle}
                </CardDescription>

                {isCurrentTier ? (
                  showManualPaidContinue ? (
                    <Button
                      type="submit"
                      className="w-full rounded-xl"
                      disabled={submitting}
                    >
                      Continue to workspace
                    </Button>
                  ) : (
                    <Button type="button" className="w-full rounded-xl" disabled>
                      Builder access active
                    </Button>
                  )
                ) : (
                  <Button
                    type="button"
                    className="w-full rounded-xl"
                    onClick={() => window.location.assign(checkoutHref)}
                  >
                    {tier.ctaLabel}
                  </Button>
                )}
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4">
                <div className="h-px bg-border/70" aria-hidden />
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value={`${tier.id}-includes`} className="border-b-0">
                    <AccordionTrigger className="py-2 text-sm font-semibold text-foreground hover:no-underline">
                      <span>{tier.featureHeading}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <TierFeatures
                        heading={tier.featureHeading}
                        items={tier.features}
                        tone="muted"
                        hideHeading
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {attemptedStep === step && errors.builderPlanTier ? (
        <p className="text-xs text-destructive">{errors.builderPlanTier}</p>
      ) : null}
    </div>
  )
}
