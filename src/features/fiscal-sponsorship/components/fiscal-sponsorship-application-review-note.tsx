import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import type { FiscalSponsorshipApplicationStatus } from "../types"

export function FiscalSponsorshipApplicationReviewNote({
  notes,
  status,
}: {
  notes?: string | null
  status?: FiscalSponsorshipApplicationStatus | null
}) {
  if (!notes?.trim()) return null

  return (
    <Alert variant={status === "declined" ? "destructive" : "default"}>
      <AlertTitle>
        {status === "needs_info"
          ? "Coach House needs more information"
          : status === "declined"
            ? "Application declined"
            : "Coach House review note"}
      </AlertTitle>
      <AlertDescription className="whitespace-pre-wrap">
        {notes}
      </AlertDescription>
    </Alert>
  )
}
