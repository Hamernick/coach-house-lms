import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

import { Button } from "@/components/ui/button"

import {
  buildMeasurementPlanActions,
  buildMeasurementReviewPrompt,
  measurementDecisionLabel,
  measurementMethodLabel,
  summarizeMeasurementPlan,
} from "../../lib/measurement-plan"
import type { MeasurementPlanDraft } from "../../types"

function EvidenceNode({
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
    <div className="bg-background min-w-0 flex-1 border p-4 sm:min-w-44">
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

function EvidenceArrow({ label }: { label: string }) {
  return (
    <div
      className="text-muted-foreground flex shrink-0 items-center justify-center py-1 sm:w-8 sm:px-1 sm:py-0"
      aria-label={label}
    >
      <ArrowRightIcon className="size-4 rotate-90 sm:rotate-0" aria-hidden />
    </div>
  )
}

export function MeasurementPlanResults({
  draft,
  copied,
  onCopy,
  onDownload,
}: {
  draft: MeasurementPlanDraft
  copied: boolean
  onCopy: () => void
  onDownload: () => void
}) {
  const summary = summarizeMeasurementPlan(draft)
  const actions = buildMeasurementPlanActions(draft)
  const prompt = buildMeasurementReviewPrompt(draft)

  return (
    <div className="bg-muted/20 border-t p-5 sm:p-6">
      <div className="bg-border grid gap-px overflow-hidden border sm:grid-cols-3">
        {[
          [
            "Drafted areas",
            `${summary.draftedAreaCount} of ${summary.totalAreaCount}`,
          ],
          ["Annual responses", summary.annualResponses.toLocaleString("en-US")],
          [
            "Respondent time",
            `${summary.annualRespondentHours.toLocaleString("en-US")} hours/year`,
          ],
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
        {summary.hasDecisionReadyChain
          ? "The decision-to-use chain is drafted. Review definitions, feasibility, safeguards, and claims before collection."
          : "Connect the outcome, question, indicator, source, owner, and action rule to complete the working evidence chain."}
      </p>

      <section className="mt-8" aria-labelledby="evidence-chain-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Live sandbox
            </p>
            <h3 id="evidence-chain-title" className="mt-2 font-semibold">
              Decision-to-use evidence chain
            </h3>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Read in order. Each connection is a planning choice to review, not
              proof that the program caused a result.
            </p>
          </div>
          <Button type="button" className="min-h-11" onClick={onDownload}>
            <DownloadIcon className="size-4" aria-hidden />
            Download plan CSV
          </Button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="flex flex-col sm:min-w-[76rem] sm:flex-row sm:items-stretch">
            <EvidenceNode
              index={1}
              label="Decision"
              value={measurementDecisionLabel(draft.decision)}
              empty="Choose a decision."
            />
            <EvidenceArrow label="The decision focuses the outcome" />
            <EvidenceNode
              index={2}
              label="Outcome"
              value={draft.outcomeStatement}
              empty="Define the expected change."
            />
            <EvidenceArrow label="The outcome focuses the question" />
            <EvidenceNode
              index={3}
              label="Question"
              value={draft.evaluationQuestion}
              empty="Ask an answerable question."
            />
            <EvidenceArrow label="The question determines the indicator" />
            <EvidenceNode
              index={4}
              label="Indicator"
              value={draft.indicatorDefinition}
              empty="Define the observable signal."
            />
            <EvidenceArrow label="The indicator requires credible evidence" />
            <EvidenceNode
              index={5}
              label="Evidence"
              value={draft.dataSource || measurementMethodLabel(draft.method)}
              empty="Choose a source and method."
            />
            <EvidenceArrow label="The evidence supports a bounded use" />
            <EvidenceNode
              index={6}
              label="Use"
              value={draft.actionRule}
              empty="State how findings could change a decision."
            />
          </div>
        </div>

        <div className="bg-border mt-4 grid gap-px overflow-hidden border lg:grid-cols-4">
          {[
            [
              "Schedule",
              draft.collectionSchedule,
              "Add collection and review timing.",
            ],
            [
              "Owner",
              draft.owner,
              "Assign plan, interpretation, and decision roles.",
            ],
            [
              "Variation and access",
              draft.disaggregationPlan,
              "Add safe comparison, access, and missingness rules.",
            ],
            [
              "Limitations",
              draft.limitations,
              "State what the evidence cannot establish.",
            ],
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

      <section className="mt-8" aria-labelledby="measurement-actions-title">
        <h3 id="measurement-actions-title" className="font-semibold">
          Stage and evidence action plan
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} actions generated from stage, missing definitions,
          safeguards, and use.
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

      <section
        className="mt-8 border"
        aria-labelledby="measurement-review-title"
      >
        <div className="bg-muted/35 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h3 id="measurement-review-title" className="text-sm font-semibold">
              Guarded measurement review
            </h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Copy the working plan and explicit anti-invention constraints for
              human-reviewed analysis.
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
          Draft counts and burden arithmetic are transparent planning aids. They
          are not a quality score, legal finding, or evidence of impact.
        </p>
        <a
          href="https://www.cdc.gov/evaluation/php/evaluation-framework-action-guide/step-4-gather-credible-evidence.html"
          target="_blank"
          rel="noreferrer"
          className="focus-visible:ring-ring inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          Review CDC evidence guidance
          <ExternalLinkIcon className="size-4" aria-hidden />
        </a>
      </div>
    </div>
  )
}
