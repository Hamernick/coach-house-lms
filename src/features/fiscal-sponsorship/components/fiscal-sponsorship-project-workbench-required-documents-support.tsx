"use client"

import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"

import type {
  FiscalSponsorshipDocumentKey,
  FiscalSponsorshipDocumentReviewStatus,
  FiscalSponsorshipProjectWorkflowSummaryDocument,
} from "../types"

export function formatReviewStatus(
  status: FiscalSponsorshipDocumentReviewStatus | null | undefined
) {
  const labels: Record<FiscalSponsorshipDocumentReviewStatus, string> = {
    accepted: "Accepted",
    needs_info: "Needs info",
    not_required: "Not required",
    pending: "Pending review",
    rejected: "Rejected",
  }

  return status ? labels[status] : "Not connected"
}

export function getStatusTone(
  status: FiscalSponsorshipDocumentReviewStatus | null | undefined
) {
  if (status === "accepted") return "bg-emerald-500/10 text-emerald-700"
  if (status === "needs_info") return "bg-amber-500/12 text-amber-700"
  if (status === "rejected") return "bg-destructive/10 text-destructive"
  if (status === "pending") return "bg-secondary text-secondary-foreground"
  return "bg-amber-500/12 text-amber-700"
}

export function reviewDecisionRequiresNote(
  decision: Exclude<FiscalSponsorshipDocumentReviewStatus, "pending">
) {
  return decision === "needs_info" || decision === "rejected"
}

export function buildDocumentLookup(
  documents: FiscalSponsorshipProjectWorkflowSummaryDocument[]
) {
  const lookup = new Map<
    FiscalSponsorshipDocumentKey,
    FiscalSponsorshipProjectWorkflowSummaryDocument
  >()

  for (const document of documents) {
    if (!document.documentKey || lookup.has(document.documentKey)) continue
    lookup.set(document.documentKey, document)
  }

  return lookup
}

export function RequiredDocumentLinkButton({
  children,
  href,
}: {
  children: ReactNode
  href?: string | null
}) {
  if (!href) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 rounded-full px-3"
        disabled
      >
        {children}
      </Button>
    )
  }

  return (
    <Button asChild variant="ghost" size="sm" className="h-8 rounded-full px-3">
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    </Button>
  )
}
