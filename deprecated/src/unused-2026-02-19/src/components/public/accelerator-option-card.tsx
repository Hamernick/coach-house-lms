"use client"

import Link from "next/link"
import { useState } from "react"

import Check from "lucide-react/dist/esm/icons/check"

import { startCheckout } from "@/app/(public)/pricing/actions"
import { CoachingAvatarGroup } from "@/components/coaching/coaching-avatar-group"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT } from "@/lib/accelerator/billing"
import { cn } from "@/lib/utils"

type TierFeature = {
  label: string
  badge?: string
  detail?: string
}

type AcceleratorOption = {
  id: "with_coaching" | "without_coaching"
  title: string
  oneTimePriceLine: string
  monthlyPriceLine: string
  subtitle: string
  ctaHref: string
  planName: string
  features: Array<string | TierFeature>
}

type AcceleratorOptionCardProps = {
  option: AcceleratorOption
  featured?: boolean
  canCheckoutOneTime: boolean
  optionOneTimePriceId: string
  canCheckoutMonthly: boolean
  optionMonthlyPriceId: string
}

type FeatureTone = "muted" | "solid"

function CheckBadge({ tone = "muted" }: { tone?: FeatureTone }) {
  return (
    <span
      className={cn(
        "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px]",
        tone === "solid"
          ? "border-transparent bg-foreground text-primary-foreground"
          : "border-border/70 bg-muted/50 text-foreground",
      )}
      aria-hidden
    >
      <Check className="h-3 w-3" />
    </span>
  )
}

function TierFeatures({
  heading,
  items,
  tone = "muted",
}: {
  heading: string
  items: Array<string | TierFeature>
  tone?: FeatureTone
}) {
  return (
    <div className="space-y-3">
      <p
        className={cn(
          "font-semibold",
          tone === "solid" ? "text-sm text-foreground" : "text-xs uppercase text-muted-foreground",
        )}
      >
        {heading}
      </p>
      <ul className="space-y-2 text-sm">
        {items.map((item) => {
          const feature = typeof item === "string" ? { label: item } : item
          const key =
            typeof item === "string"
              ? item
              : `${feature.label}-${feature.badge ?? ""}-${feature.detail ?? ""}`

          return (
            <li key={key} className="flex items-start gap-2">
              <CheckBadge tone={tone} />
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(tone === "solid" ? "text-foreground" : "text-muted-foreground")}>
                  {feature.label}
                </span>
                {feature.badge ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      feature.badge.toLowerCase() === "coming soon" &&
                        "border border-border/70 bg-muted/60 text-muted-foreground",
                    )}
                  >
                    {feature.badge}
                  </Badge>
                ) : null}
                {feature.detail ? <span className="text-muted-foreground">{feature.detail}</span> : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function AcceleratorOptionCard({
  option,
  featured = false,
  canCheckoutOneTime,
  optionOneTimePriceId,
  canCheckoutMonthly,
  optionMonthlyPriceId,
}: AcceleratorOptionCardProps) {
  const [billing, setBilling] = useState<"one_time" | "monthly">("one_time")
  const isMonthly = billing === "monthly"
  const selectedPriceLine = isMonthly ? option.monthlyPriceLine : option.oneTimePriceLine
  const selectedPriceNote = isMonthly ? "per month" : "one-time"
  const selectedBillingDetails = isMonthly
    ? `${ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT} monthly payments. Platform access stays active during installments, then continues at $20/month unless canceled.`
    : "One payment today. Includes 6 months of platform access, then continues at $20/month unless canceled."
  const selectedPlanName = isMonthly ? `${option.planName} Monthly` : option.planName
  const selectedCanCheckout = isMonthly ? canCheckoutMonthly : canCheckoutOneTime
  const selectedPriceId = isMonthly ? optionMonthlyPriceId : optionOneTimePriceId
  const selectedFallbackHref = isMonthly ? `${option.ctaHref}&billing=monthly` : option.ctaHref

  return (
    <Card
      className={cn(
        "flex h-full flex-col rounded-3xl border border-border/70",
        featured && "border-2 border-dashed border-primary/30",
      )}
    >
      <CardHeader className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-2xl font-semibold tracking-tight">{option.title}</CardTitle>
          <div className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setBilling("one_time")}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                !isMonthly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
              aria-pressed={!isMonthly}
            >
              Pay once
            </button>
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                isMonthly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
              aria-pressed={isMonthly}
            >
              Pay monthly
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-semibold tracking-tight">{selectedPriceLine}</span>
            <span className="pb-1 text-sm font-medium text-muted-foreground">{selectedPriceNote}</span>
          </div>
          <p className="text-xs text-muted-foreground">{selectedBillingDetails}</p>
          <CardDescription className="text-sm leading-relaxed text-muted-foreground">{option.subtitle}</CardDescription>
          {option.id === "with_coaching" ? (
            <div className="pt-1">
              <CoachingAvatarGroup size="sm" />
            </div>
          ) : null}
        </div>

        {selectedCanCheckout ? (
          <form action={startCheckout} className="w-full">
            <input type="hidden" name="checkoutMode" value="accelerator" />
            <input type="hidden" name="acceleratorVariant" value={option.id} />
            <input type="hidden" name="acceleratorBilling" value={billing} />
            <input type="hidden" name="planName" value={selectedPlanName} />
            <input type="hidden" name="priceId" value={selectedPriceId} />
            <Button type="submit" className="w-full rounded-xl">
              Continue
            </Button>
          </form>
        ) : (
          <Button asChild className="w-full rounded-xl">
            <Link href={selectedFallbackHref}>Continue</Link>
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5 px-6 pb-6">
        <div className="h-px w-full bg-border/70" aria-hidden />
        <TierFeatures heading="Includes" items={option.features} tone="muted" />
      </CardContent>
    </Card>
  )
}
