import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { BillingCheckoutButton } from "../billing-checkout-button"

type BillingPlanCardProps = {
  title: string
  description: string
  icon: LucideIcon
  bullets: string[]
  plan: "organization" | "operations_support"
  checkoutReady: boolean
  buttonLabel: string
  current: boolean
  currentBadgeLabel?: string
  unavailableLabel: string
  variant?: "default" | "secondary"
  highlighted?: boolean
}

export function BillingPlanCard({
  title,
  description,
  icon: Icon,
  bullets,
  plan,
  checkoutReady,
  buttonLabel,
  current,
  currentBadgeLabel = "Current",
  unavailableLabel,
  variant = "default",
  highlighted = false,
}: BillingPlanCardProps) {
  return (
    <Card className={highlighted ? "border-primary/30 ring-1 ring-primary/15" : "border-border/70"}>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
          <Badge variant="secondary" className="rounded-full border border-border/70 bg-muted/50">
            {current ? currentBadgeLabel : highlighted ? "Upgrade" : currentBadgeLabel}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {bullet}
            </li>
          ))}
        </ul>
        {current ? (
          <p className="rounded-xl border border-border/70 bg-muted/35 px-3 py-2 text-center text-xs font-medium text-muted-foreground">
            You are currently on this plan.
          </p>
        ) : !checkoutReady ? (
          <BillingCheckoutButton
            plan={plan}
            className="w-full rounded-xl"
            variant={variant}
            disabled
          >
            {unavailableLabel}
          </BillingCheckoutButton>
        ) : (
          <BillingCheckoutButton
            plan={plan}
            className="w-full rounded-xl"
            variant={variant}
          >
            {buttonLabel}
          </BillingCheckoutButton>
        )}
      </CardContent>
    </Card>
  )
}
