import CheckIcon from "lucide-react/dist/esm/icons/check"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PricingPlanTier } from "@/lib/billing/plan-tier"
import { cn } from "@/lib/utils"

import { resolveTierLabel, type OverlayTier } from "@/components/paywall/paywall-overlay/config"

type PaywallTierCardProps = {
  tier: OverlayTier
  currentPlanTier: PricingPlanTier
  source: string | null
}

export function PaywallTierCard({ tier, currentPlanTier, source }: PaywallTierCardProps) {
  const details = resolveTierLabel({ tier, currentPlanTier })

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-sm",
        tier.featured && "border-primary/35 ring-1 ring-primary/20",
        tier.id === currentPlanTier && "border-foreground/20 ring-1 ring-foreground/10",
      )}
    >
      <div
        className={cn(
          "h-1 w-full bg-border/60",
          tier.featured && "bg-primary/60",
          tier.id === currentPlanTier && "bg-foreground/45",
        )}
        aria-hidden
      />
      <CardHeader className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tier.eyebrow}</p>
          {details.badge ? (
            <Badge variant="secondary" className="rounded-full border border-border/70 bg-muted/40 text-xs">
              {details.badge}
            </Badge>
          ) : null}
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">{tier.title}</CardTitle>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-semibold tracking-tight">{tier.priceLine}</span>
            {tier.priceNote ? <span className="pb-1 text-xs font-medium text-muted-foreground">{tier.priceNote}</span> : null}
          </div>
          <p className="min-h-12 text-sm text-muted-foreground">{tier.subtitle}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 p-5 pt-0">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" aria-hidden />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto space-y-2 pt-2">
          {details.cta && tier.planName ? (
            <Button
              type="button"
              className="h-10 w-full rounded-xl"
              variant={tier.id === "organization" ? "default" : "secondary"}
              onClick={() =>
                window.location.assign(
                  `/api/stripe/checkout?plan=${tier.id}&source=${encodeURIComponent(source ?? "billing")}`,
                )
              }
            >
              {details.cta}
            </Button>
          ) : (
            <p className="rounded-xl border border-border/70 bg-muted/35 px-3 py-2 text-center text-xs font-medium text-muted-foreground">
              {details.note}
            </p>
          )}
          {details.cta ? <p className="text-xs leading-relaxed text-muted-foreground">{details.note}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
