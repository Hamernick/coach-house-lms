import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"

type BillingCheckoutButtonProps = {
  plan: "organization" | "operations_support"
  children: ReactNode
  disabled?: boolean
  variant?: "default" | "secondary"
  className?: string
}

export function BillingCheckoutButton({
  plan,
  children,
  disabled = false,
  variant = "default",
  className,
}: BillingCheckoutButtonProps) {
  if (disabled) {
    return (
      <Button type="button" className={className} variant={variant} disabled>
        {children}
      </Button>
    )
  }

  return (
    <Button asChild className={className} variant={variant}>
      <a href={`/api/stripe/checkout?plan=${plan}&source=billing`}>{children}</a>
    </Button>
  )
}
