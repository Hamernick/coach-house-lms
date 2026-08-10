import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"

import { startBillingPlanTransition } from "./actions"
import { BillingPlanSubmitButton } from "./billing-plan-submit-button"

type BillingCheckoutButtonProps = {
  plan: "organization" | "operations_support"
  children: ReactNode
  disabled?: boolean
  variant?: "default" | "secondary"
  className?: string
  attempt?: string
}

export function BillingCheckoutButton({
  plan,
  children,
  disabled = false,
  variant = "default",
  className,
  attempt = "billing-plan-transition",
}: BillingCheckoutButtonProps) {
  if (disabled) {
    return (
      <Button type="button" className={className} variant={variant} disabled>
        {children}
      </Button>
    )
  }

  return (
    <form action={startBillingPlanTransition} className="w-full">
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="attempt" value={attempt} />
      <BillingPlanSubmitButton className={className} variant={variant}>
        {children}
      </BillingPlanSubmitButton>
    </form>
  )
}
