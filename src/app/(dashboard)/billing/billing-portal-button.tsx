"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { createPortalSessionAction } from "./actions"

export function BillingPortalButton() {
  const [isPending, startTransition] = useTransition()

  function handleOpenPortal() {
    startTransition(async () => {
      const result = await createPortalSessionAction()
      if (result?.url) {
        window.location.href = result.url
      } else if (result?.error) {
        toast.error(result.error)
      } else {
        toast.error("Billing portal is unavailable.")
      }
    })
  }

  return (
    <Button onClick={handleOpenPortal} disabled={isPending} variant="outline">
      {isPending ? "Opening portal..." : "Open billing portal"}
    </Button>
  )
}
