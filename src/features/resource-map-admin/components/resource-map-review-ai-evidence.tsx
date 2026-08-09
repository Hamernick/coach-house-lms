import Link from "next/link"

import AlertTriangleIcon from "lucide-react/dist/esm/icons/alert-triangle"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import type { ResourceMapAdminReviewRecord } from "../types"

function ReviewValue({ value }: { value: unknown }) {
  return (
    <p className="text-sm leading-6 break-words whitespace-pre-wrap">
      {formatResourceMapReviewValue(value)}
    </p>
  )
}

function actorLabel(
  detail: ResourceMapAdminReviewRecord,
  actorId: string | null
) {
  if (!actorId) return "Automated pass"
  const profile = detail.reviewerProfiles.find((item) => item.id === actorId)
  return profile?.full_name ?? profile?.email ?? actorId
}

export function ResourceMapReviewAiEvidence({
  detail,
  summary,
}: {
  detail: ResourceMapAdminReviewRecord
  summary: ResourceMapReviewSummary
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            <h3 className="scroll-mt-24">AI Draft And Citations</h3>
          </CardTitle>
          <CardDescription>
            Draft content is review material, not an approval decision.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {summary.aiDraft ? (
            <dl className="grid gap-3">
              {Object.entries(summary.aiDraft)
                .filter(([key]) => key !== "citations")
                .map(([key, value]) => (
                  <div key={key} className="min-w-0 rounded-md border p-3">
                    <dt className="text-muted-foreground text-xs font-medium">
                      {key.replace(/([a-z])([A-Z])/g, "$1 $2")}
                    </dt>
                    <dd className="mt-1">
                      <ReviewValue value={value} />
                    </dd>
                  </div>
                ))}
            </dl>
          ) : (
            <p className="text-muted-foreground text-sm">
              No AI draft recorded. Run source-grounded enrichment before
              approval.
            </p>
          )}
          <div>
            <h4 className="scroll-mt-24 text-sm font-medium">Citations</h4>
            {summary.citations.length > 0 ? (
              <ul className="mt-2 grid gap-2">
                {summary.citations.map((citation, index) => (
                  <li
                    key={`${citation.sourceUrl}-${index}`}
                    className="rounded-md border p-3"
                  >
                    <p className="text-muted-foreground text-xs break-words">
                      {citation.claimPaths.join(", ") || "Unlabeled claims"}
                    </p>
                    {citation.evidenceSnippet ? (
                      <p className="mt-1 text-sm leading-6 break-words">
                        {citation.evidenceSnippet}
                      </p>
                    ) : null}
                    <Link
                      href={citation.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary focus-visible:ring-ring mt-2 inline-flex min-h-11 items-center gap-1 text-xs font-medium break-all underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none sm:min-h-6"
                    >
                      {citation.sourceUrl}
                      <ExternalLinkIcon
                        className="size-3 shrink-0"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mt-2 text-sm">
                No claim citations recorded.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h3 className="scroll-mt-24">Verification Passes</h3>
          </CardTitle>
          <CardDescription>
            Independent checks, conflicts, models, and reviewer actors.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {detail.enrichmentRuns.length > 0 ? (
            detail.enrichmentRuns.map((run) => (
              <details
                key={run.id}
                className="rounded-md border p-3"
                open={run.status !== "completed"}
              >
                <summary className="focus-visible:ring-ring min-h-11 cursor-pointer text-sm font-medium focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none sm:min-h-6">
                  {run.pass_type.replaceAll("_", " ")} · Pass {run.pass_number}{" "}
                  · {run.status}
                </summary>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs">Model</dt>
                    <dd className="break-words">
                      {run.model ?? "Not recorded"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">
                      Prompt Version
                    </dt>
                    <dd className="font-mono text-xs break-words">
                      {run.prompt_version}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Actor</dt>
                    <dd className="break-words">
                      {actorLabel(detail, run.actor_id)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">
                      Structured Result
                    </dt>
                    <dd>
                      <ReviewValue value={run.structured_result} />
                    </dd>
                  </div>
                </dl>
              </details>
            ))
          ) : summary.verification ? (
            <div className="rounded-md border p-3">
              <ReviewValue value={summary.verification} />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No independent verification pass recorded.
            </p>
          )}
          {summary.conflicts.length > 0 ? (
            <Alert variant="destructive">
              <AlertTriangleIcon aria-hidden />
              <AlertTitle>Conflicts Require Resolution</AlertTitle>
              <AlertDescription>
                <ul className="list-disc space-y-1 pl-4">
                  {summary.conflicts.map((conflict) => (
                    <li key={conflict} className="break-words">
                      {conflict}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
