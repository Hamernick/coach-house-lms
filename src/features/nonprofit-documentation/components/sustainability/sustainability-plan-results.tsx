import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

import { Button } from "@/components/ui/button"

import {
  buildSustainabilityActions,
  buildSustainabilityReviewPrompt,
  sustainabilityDirectionLabel,
  summarizeSustainabilityPlan,
} from "../../lib/sustainability-plan"
import type { SustainabilityPlanDraft } from "../../types"

function dollars(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function ContinuityNode({
  label,
  value,
  empty,
  index,
}: {
  label: string
  value: string
  empty: string
  index: number
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

function ContinuityArrow({ label }: { label: string }) {
  return (
    <div
      className="text-muted-foreground flex shrink-0 items-center justify-center py-1 sm:w-8 sm:px-1 sm:py-0"
      aria-label={label}
    >
      <ArrowRightIcon className="size-4 rotate-90 sm:rotate-0" aria-hidden />
    </div>
  )
}

export function SustainabilityPlanResults({
  draft,
  copied,
  onCopy,
  onDownload,
}: {
  draft: SustainabilityPlanDraft
  copied: boolean
  onCopy: () => void
  onDownload: () => void
}) {
  const summary = summarizeSustainabilityPlan(draft)
  const actions = buildSustainabilityActions(draft)
  const prompt = buildSustainabilityReviewPrompt(draft)
  const capacityLabel =
    summary.weeklyCapacityBalance < 0
      ? `${Math.abs(summary.weeklyCapacityBalance).toLocaleString("en-US")} hour weekly gap`
      : `${summary.weeklyCapacityBalance.toLocaleString("en-US")} hours available weekly`

  return (
    <div className="bg-muted/20 border-t p-5 sm:p-6">
      <div className="bg-border grid gap-px overflow-hidden border sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Flexible resources", dollars(summary.flexibleResources)],
          [
            `Planned cost · ${draft.horizonMonths} months`,
            dollars(summary.horizonPlannedCost),
          ],
          [
            "Projected flexible balance",
            dollars(summary.projectedFlexibleBalance),
          ],
          [
            "Starting cash runway",
            `${summary.startingRunwayMonths.toLocaleString("en-US")} months`,
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <p
          className="bg-background border px-4 py-3 text-sm font-medium"
          aria-live="polite"
        >
          {capacityLabel}. Available minus committed supported hours.
        </p>
        <p className="bg-background border px-4 py-3 text-sm font-medium">
          {dollars(draft.restrictedFunds)} in restricted funds is displayed
          separately and excluded from flexible-resource math.
        </p>
      </div>

      <p
        className="bg-background mt-3 border px-4 py-3 text-sm font-medium"
        aria-live="polite"
      >
        {summary.hasReviewableScenario
          ? "The scenario is drafted. Reconcile it with current records, cash timing, restrictions, affected people, and authorized reviewers."
          : "Draft the mission benefit, commitments, assumptions, triggers, and owner to make the scenario reviewable."}
      </p>

      <section className="mt-8" aria-labelledby="continuity-chain-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Live sandbox
            </p>
            <h3 id="continuity-chain-title" className="mt-2 font-semibold">
              Mission continuity chain
            </h3>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Read in order. The chain exposes dependencies and decisions; it
              does not certify that the work is sustainable.
            </p>
          </div>
          <Button type="button" className="min-h-11" onClick={onDownload}>
            <DownloadIcon className="size-4" aria-hidden /> Download scenario
            CSV
          </Button>
        </div>
        <div className="mt-5 overflow-x-auto">
          <div className="flex flex-col sm:min-w-[74rem] sm:flex-row sm:items-stretch">
            <ContinuityNode
              index={1}
              label="Direction"
              value={sustainabilityDirectionLabel(draft.direction)}
              empty="Choose a direction."
            />
            <ContinuityArrow label="The direction protects a mission benefit" />
            <ContinuityNode
              index={2}
              label="Mission benefit"
              value={draft.missionPriority}
              empty="Define the benefit to protect."
            />
            <ContinuityArrow label="The benefit creates essential commitments" />
            <ContinuityNode
              index={3}
              label="Commitments"
              value={draft.essentialCommitments}
              empty="Define full-cost commitments."
            />
            <ContinuityArrow label="Commitments depend on people and resources" />
            <ContinuityNode
              index={4}
              label="People and resources"
              value={`${capacityLabel}; ${dollars(summary.flexibleResources)} flexible resources.`}
              empty="Test capacity and resources."
            />
            <ContinuityArrow label="Delivery depends on systems and relationships" />
            <ContinuityNode
              index={5}
              label="Systems and partners"
              value={draft.systemsDependencies}
              empty="Identify critical dependencies."
            />
            <ContinuityArrow label="Evidence and conditions trigger a decision" />
            <ContinuityNode
              index={6}
              label="Decision triggers"
              value={draft.adaptationTriggers}
              empty="Define when and how to act."
            />
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="sustainability-actions-title">
        <h3 id="sustainability-actions-title" className="font-semibold">
          Stage and scenario action plan
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} actions generated from stage, resource position,
          capacity, restrictions, continuity, and governance.
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
        aria-labelledby="sustainability-review-title"
      >
        <div className="bg-muted/35 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h3
              id="sustainability-review-title"
              className="text-sm font-semibold"
            >
              Guarded scenario review
            </h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Copy the assumptions, calculations, and anti-invention constraints
              for human-reviewed planning.
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
          This simplified scenario excludes transaction timing, probability,
          restricted funds, receivables, liabilities, and many real operating
          conditions.
        </p>
        <a
          href="https://www.cdc.gov/pcd/issues/2014/13_0185.htm"
          target="_blank"
          rel="noreferrer"
          className="focus-visible:ring-ring inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          Review CDC sustainability planning{" "}
          <ExternalLinkIcon className="size-4" aria-hidden />
        </a>
      </div>
    </div>
  )
}
