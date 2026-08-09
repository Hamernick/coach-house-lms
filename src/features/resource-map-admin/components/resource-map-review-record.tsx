import Link from "next/link"

import AlertTriangleIcon from "lucide-react/dist/esm/icons/alert-triangle"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import UserRoundCheckIcon from "lucide-react/dist/esm/icons/user-round-check"

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
  buildResourceMapReviewSummary,
  safeResourceMapExternalUrl,
} from "../lib/review-view-model"
import type {
  ResourceMapAdminReviewFormActions,
  ResourceMapAdminReviewRecord,
} from "../types"
import { ResourceMapReviewDecisionForm } from "./resource-map-review-actions"
import { ResourceMapReviewAiEvidence } from "./resource-map-review-ai-evidence"
import {
  ResourceMapReviewCompleteness,
  ResourceMapReviewSourceComparison,
} from "./resource-map-review-evidence"
import { ResourceMapReviewVisibility } from "./resource-map-review-visibility"

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/New_York",
})

function formatDate(value: string | null) {
  if (!value) return "Not recorded"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Invalid date"
    : DATE_FORMATTER.format(date)
}

function reviewerLabel(
  detail: ResourceMapAdminReviewRecord,
  id: string | null
) {
  if (!id) return "Not reviewed"
  const profile = detail.reviewerProfiles.find((item) => item.id === id)
  if (!profile) return id
  return profile.full_name ?? profile.email ?? profile.id
}

function statusVariant(status: string) {
  if (["approved", "completed", "promoted", "unique"].includes(status)) {
    return "default" as const
  }
  if (["rejected", "blocked", "stale", "duplicate"].includes(status)) {
    return "destructive" as const
  }
  return "outline" as const
}

export function ResourceMapReviewRecord({
  detail,
  actions,
}: {
  detail: ResourceMapAdminReviewRecord
  actions: Pick<
    ResourceMapAdminReviewFormActions,
    "reviewImportRecord" | "setPublicVisibility"
  >
}) {
  const summary = buildResourceMapReviewSummary({
    record: detail.record,
    evidence: detail.fieldEvidence,
    enrichmentRuns: detail.enrichmentRuns,
  })
  const unresolvedMatches = detail.matches.filter((match) =>
    ["pending", "accepted"].includes(match.match_status)
  )
  const approvalBlocked =
    !summary.readyForHumanApproval || unresolvedMatches.length > 0
  const providerSourceUrl = safeResourceMapExternalUrl(detail.record.source_url)

  return (
    <article
      className="min-w-0 space-y-4"
      aria-labelledby="review-record-title"
    >
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(detail.record.review_status)}>
              Review: {detail.record.review_status.replaceAll("_", " ")}
            </Badge>
            <Badge variant={statusVariant(detail.record.promotion_status)}>
              Publication: {detail.record.promotion_status.replaceAll("_", " ")}
            </Badge>
            <Badge
              variant={statusVariant(detail.record.duplicate_match_status)}
            >
              Match: {detail.record.duplicate_match_status.replaceAll("_", " ")}
            </Badge>
          </div>
          <div className="min-w-0">
            <CardTitle>
              <h2
                id="review-record-title"
                className="scroll-mt-24 text-xl leading-7 tracking-tight break-words"
              >
                {detail.record.normalized_name ??
                  detail.record.source_record_id ??
                  "Untitled Resource"}
              </h2>
            </CardTitle>
            <CardDescription className="mt-2 leading-6 break-words">
              Source record {detail.record.source_record_id ?? detail.record.id}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <dl className="border-border/70 grid gap-3 rounded-md border p-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0">
              <dt className="text-muted-foreground text-xs font-medium">
                Source
              </dt>
              <dd className="mt-1 text-sm break-words">
                {detail.source?.name ?? "Unknown source"}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-muted-foreground text-xs font-medium">
                Fetched
              </dt>
              <dd className="mt-1 text-sm tabular-nums">
                {formatDate(
                  detail.rawIngestion?.fetched_at ??
                    detail.record.last_scraped_at
                )}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-muted-foreground text-xs font-medium">
                Reviewed By
              </dt>
              <dd className="mt-1 text-sm break-words">
                {reviewerLabel(detail, detail.record.reviewed_by)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-muted-foreground text-xs font-medium">
                Reviewed At
              </dt>
              <dd className="mt-1 text-sm tabular-nums">
                {formatDate(detail.record.reviewed_at)}
              </dd>
            </div>
          </dl>
          <div className="flex min-w-0 flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground inline-flex min-w-0 items-center gap-2">
              <UserRoundCheckIcon className="size-4 shrink-0" aria-hidden />
              Reviewing as
              <strong className="text-foreground font-medium break-words">
                {reviewerLabel(detail, detail.currentReviewerId)}
              </strong>
            </span>
            {providerSourceUrl ? (
              <Link
                href={providerSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary focus-visible:ring-ring inline-flex min-h-11 min-w-0 items-center gap-1 font-medium break-all underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none sm:min-h-6"
              >
                Open Provider Source
                <ExternalLinkIcon className="size-3.5 shrink-0" aria-hidden />
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {unresolvedMatches.length > 0 ? (
        <Alert variant="destructive">
          <AlertTriangleIcon aria-hidden />
          <AlertTitle>Duplicate Review Blocks Approval</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {unresolvedMatches.map((match) => (
                <li key={match.id} className="break-words">
                  {match.match_kind.replaceAll("_", " ")} match at{" "}
                  {match.match_score === null
                    ? "an unscored confidence"
                    : `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(match.match_score)}% confidence`}
                  ; status {match.match_status}.
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <ResourceMapReviewCompleteness
        summary={summary}
        ledgerAvailable={detail.enrichmentLedgerAvailable}
      />
      <ResourceMapReviewSourceComparison summary={summary} />
      <ResourceMapReviewAiEvidence detail={detail} summary={summary} />
      <ResourceMapReviewVisibility
        detail={detail}
        action={actions.setPublicVisibility}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            <h3 className="scroll-mt-24">Human Review Decision</h3>
          </CardTitle>
          <CardDescription>
            Approval is disabled until source, completeness, verification, and
            duplicate checks pass. Rejection and stale decisions require an
            audit reason.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResourceMapReviewDecisionForm
            action={actions.reviewImportRecord}
            importRecordId={detail.record.id}
            approvalBlocked={approvalBlocked}
          />
        </CardContent>
      </Card>
    </article>
  )
}
