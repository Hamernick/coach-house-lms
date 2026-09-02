import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

import { Button } from "@/components/ui/button"

import {
  buildLogicModelActions,
  buildLogicModelReviewPrompt,
  recommendedFramework,
  summarizeLogicModel,
} from "../../lib/framework-workspace"
import type { LogicModelDraft } from "../../types"

function ModelNode({
  index,
  label,
  value,
  empty,
}: {
  index: number
  label: string
  value: string
  empty: string
}) {
  return (
    <div className="bg-background min-w-0 flex-1 border p-4 sm:min-w-40">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide uppercase">{label}</p>
        <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
          {String(index).padStart(2, "0")}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 font-medium break-words">
        {value || empty}
      </p>
    </div>
  )
}

function ModelArrow({ label }: { label: string }) {
  return (
    <div
      className="text-muted-foreground flex shrink-0 items-center justify-center gap-2 py-1 sm:w-8 sm:px-1 sm:py-0"
      aria-label={label}
    >
      <ArrowRightIcon className="size-4 rotate-90 sm:rotate-0" aria-hidden />
    </div>
  )
}

export function FrameworkWorkspaceResults({
  draft,
  copied,
  onCopy,
  onDownload,
}: {
  draft: LogicModelDraft
  copied: boolean
  onCopy: () => void
  onDownload: () => void
}) {
  const summary = summarizeLogicModel(draft)
  const recommendation = recommendedFramework(draft.primaryQuestion)
  const actions = buildLogicModelActions(draft)
  const prompt = buildLogicModelReviewPrompt(draft)

  return (
    <div className="bg-muted/20 border-t p-5 sm:p-6">
      <div className="bg-border grid gap-px overflow-hidden border sm:grid-cols-3">
        {[
          [
            "Drafted areas",
            `${summary.draftedAreaCount} of ${summary.totalAreaCount}`,
          ],
          ["Connected pathway links", `${summary.causalLinkCount} of 5`],
          ["Starting framework", recommendation.title],
        ].map(([label, value]) => (
          <div key={label} className="bg-background p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {label}
            </p>
            <p className="mt-3 text-lg font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <p
        className="bg-background mt-4 border px-4 py-3 text-sm font-medium"
        aria-live="polite"
      >
        {summary.hasCompletePathway
          ? "The activity-to-outcome pathway is drafted. Review every arrow and assumption before using it."
          : "Draft activities, outputs, and sequenced outcomes to connect the complete working pathway."}
      </p>

      <section className="mt-8" aria-labelledby="live-model-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Live sandbox
            </p>
            <h3 id="live-model-title" className="mt-2 font-semibold">
              Program logic model
            </h3>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Read left to right on larger screens or top to bottom on smaller
              screens. Arrows represent hypotheses to review, not proven causes.
            </p>
          </div>
          <Button type="button" className="min-h-11" onClick={onDownload}>
            <DownloadIcon className="size-4" aria-hidden />
            Download model CSV
          </Button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="flex flex-col sm:min-w-[72rem] sm:flex-row sm:items-stretch">
            <ModelNode
              index={1}
              label="Inputs"
              value={draft.inputs}
              empty="Add the resources required."
            />
            <ModelArrow label="Inputs may enable activities" />
            <ModelNode
              index={2}
              label="Activities"
              value={draft.activities}
              empty="Add what the program and participants do."
            />
            <ModelArrow label="Activities may produce outputs" />
            <ModelNode
              index={3}
              label="Outputs"
              value={draft.outputs}
              empty="Add the direct products of activities."
            />
            <ModelArrow label="Outputs may support near-term outcomes" />
            <ModelNode
              index={4}
              label="Near term"
              value={draft.nearTermOutcomes}
              empty="Add the earliest expected changes."
            />
            <ModelArrow label="Near-term outcomes may support intermediate outcomes" />
            <ModelNode
              index={5}
              label="Intermediate"
              value={draft.intermediateOutcomes}
              empty="Add changes expected over more time."
            />
            <ModelArrow label="Intermediate outcomes may contribute to longer-term change" />
            <ModelNode
              index={6}
              label="Long-term contribution"
              value={draft.longTermContribution}
              empty="Add the broader result this work may support."
            />
          </div>
        </div>

        <div className="bg-border mt-4 grid gap-px overflow-hidden border lg:grid-cols-4">
          {[
            ["Need", draft.need, "Add the need or opportunity."],
            ["People", draft.people, "Add who is most affected."],
            ["Assumptions", draft.assumptions, "Add what must be true."],
            ["Context", draft.context, "Add external conditions."],
          ].map(([label, value, empty]) => (
            <div key={label} className="bg-background p-4">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {label}
              </p>
              <p className="mt-3 text-sm leading-6 break-words">
                {value || empty}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="framework-actions-title">
        <h3 id="framework-actions-title" className="font-semibold">
          Stage and model action plan
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} actions generated from the selected question, stage,
          and missing model areas.
        </p>
        <ol className="mt-4 divide-y border-y">
          {actions.map((item, index) => (
            <li
              key={item.id}
              className="grid gap-3 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)]"
            >
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <span className="bg-muted border px-2 py-0.5 text-[11px] font-medium">
                  {item.phase}
                </span>
                <p className="mt-3 text-sm leading-6 font-semibold">
                  {item.action}
                </p>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  <strong className="text-foreground">Keep:</strong>{" "}
                  {item.evidence}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 border" aria-labelledby="framework-review-title">
        <div className="bg-muted/35 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h3 id="framework-review-title" className="text-sm font-semibold">
              Guarded framework review
            </h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Copy the working hypotheses and safeguards for human-reviewed
              analysis.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={onCopy}
          >
            {copied ? (
              <CheckIcon className="size-4" aria-hidden />
            ) : (
              <CopyIcon className="size-4" aria-hidden />
            )}
            {copied ? "Copied" : "Copy review prompt"}
          </Button>
        </div>
        <pre className="max-h-80 overflow-auto p-4 font-mono text-xs leading-5 break-words whitespace-pre-wrap">
          {prompt}
        </pre>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground max-w-xl text-xs leading-5">
          Draft counts show which text areas contain content. They are not a
          quality score, readiness rating, or evidence that the pathway works.
        </p>
        <a
          href="https://www.cdc.gov/evaluation/php/evaluation-framework-action-guide/step-2-describe-the-program.html"
          target="_blank"
          rel="noreferrer"
          className="focus-visible:ring-ring inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          Review CDC logic-model guidance
          <ExternalLinkIcon className="size-4" aria-hidden />
        </a>
      </div>
    </div>
  )
}
