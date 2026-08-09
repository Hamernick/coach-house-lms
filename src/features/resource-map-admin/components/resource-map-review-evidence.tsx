import Link from "next/link"

import AlertTriangleIcon from "lucide-react/dist/esm/icons/alert-triangle"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import XCircleIcon from "lucide-react/dist/esm/icons/x-circle"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  formatResourceMapReviewValue,
  type ResourceMapReviewSummary,
} from "../lib/review-view-model"

function formatConfidence(value: number | null) {
  if (value === null) return "Not scored"
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}% confidence`
}

function ReviewValue({ value }: { value: unknown }) {
  return (
    <p className="text-sm leading-6 break-words whitespace-pre-wrap">
      {formatResourceMapReviewValue(value)}
    </p>
  )
}

export function ResourceMapReviewCompleteness({
  summary,
  ledgerAvailable,
}: {
  summary: ResourceMapReviewSummary
  ledgerAvailable: boolean
}) {
  const completedCount = summary.checks.filter((check) => check.complete).length

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>
            <h3 className="scroll-mt-24">Publication Readiness</h3>
          </CardTitle>
          <Badge
            variant={summary.readyForHumanApproval ? "default" : "destructive"}
            className="tabular-nums"
          >
            {completedCount}/{summary.checks.length} Checks Complete
          </Badge>
        </div>
        <CardDescription>
          Deterministic checks must pass before an administrator can approve the
          record.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!ledgerAvailable ? (
          <Alert>
            <AlertTriangleIcon aria-hidden />
            <AlertTitle>Enrichment Ledger Unavailable</AlertTitle>
            <AlertDescription>
              Apply the pending enrichment-run migration before relying on AI
              pass history. Embedded record evidence remains visible.
            </AlertDescription>
          </Alert>
        ) : null}
        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Readiness checks">
          {summary.checks.map((check) => (
            <li
              key={check.key}
              className="border-border/70 flex min-w-0 gap-3 rounded-md border p-3"
            >
              {check.complete ? (
                <CheckCircle2Icon
                  className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400"
                  aria-hidden
                />
              ) : (
                <XCircleIcon
                  className="text-destructive mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{check.label}</p>
                <p className="text-muted-foreground mt-1 text-xs leading-5 break-words">
                  {check.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {summary.blockers.length > 0 ? (
          <Alert variant="destructive">
            <AlertTriangleIcon aria-hidden />
            <AlertTitle>
              {summary.blockers.length} Approval Blocker
              {summary.blockers.length === 1 ? "" : "s"}
            </AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4">
                {summary.blockers.map((blocker) => (
                  <li key={blocker} className="break-words">
                    {blocker}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <CheckCircle2Icon aria-hidden />
            <AlertTitle>Ready For Human Approval</AlertTitle>
            <AlertDescription>
              Source, completeness, and independent verification checks pass.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export function ResourceMapReviewSourceComparison({
  summary,
}: {
  summary: ResourceMapReviewSummary
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 className="scroll-mt-24">Source Vs Extracted Values</h3>
        </CardTitle>
        <CardDescription>
          Compare provider evidence with the proposed public value before
          reviewing AI output.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <div className="bg-muted/45 text-muted-foreground hidden grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b px-4 py-2 text-xs font-medium md:grid">
            <span>Field</span>
            <span>Authoritative Source</span>
            <span>Extracted / AI Draft</span>
          </div>
          <div className="divide-y">
            {summary.comparisons.map((comparison) => (
              <section
                key={comparison.field}
                aria-labelledby={`comparison-${comparison.field}`}
                className="grid min-w-0 gap-3 p-4 md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-4"
              >
                <div className="min-w-0">
                  <h4
                    id={`comparison-${comparison.field}`}
                    className="scroll-mt-24 text-sm font-medium"
                  >
                    {comparison.label}
                  </h4>
                  <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                    {formatConfidence(comparison.confidence)}
                  </p>
                </div>
                <div className="bg-muted/35 min-w-0 rounded-md p-3">
                  <p className="text-muted-foreground mb-1 text-xs font-medium md:hidden">
                    Authoritative Source
                  </p>
                  <ReviewValue value={comparison.sourceValue} />
                  {comparison.sourceUrl ? (
                    <Link
                      href={comparison.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary focus-visible:ring-ring mt-2 inline-flex min-h-11 items-center gap-1 text-xs font-medium break-all underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none sm:min-h-6"
                    >
                      Open Source
                      <ExternalLinkIcon className="size-3" aria-hidden />
                    </Link>
                  ) : null}
                </div>
                <div className="border-border/70 min-w-0 rounded-md border p-3">
                  <p className="text-muted-foreground mb-1 text-xs font-medium md:hidden">
                    Extracted / AI Draft
                  </p>
                  <ReviewValue value={comparison.extractedValue} />
                </div>
              </section>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
