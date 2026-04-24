"use client"

import { useTransition } from "react"

import { createBillingPortalSession } from "@/app/(dashboard)/billing/actions"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

type BillingPortalLaunchButtonProps = {
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
  className?: string
  idleLabel?: string
  pendingLabel?: string
}

export function BillingPortalLaunchButton({
  variant = "outline",
  className,
  idleLabel = "Open billing portal",
  pendingLabel = "Opening portal...",
}: BillingPortalLaunchButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleOpenPortal() {
    startTransition(async () => {
      const result = await createBillingPortalSession()
      if (result?.url) {
        window.location.href = result.url
      } else if (result?.error) {
        toast.error(result.error)
      } else {
        toast.error("Billing portal is currently unavailable.")
      }
    })
  }

  return (
    <Button onClick={handleOpenPortal} disabled={isPending} variant={variant} className={className}>
      {isPending ? pendingLabel : idleLabel}
    </Button>
  )
}
