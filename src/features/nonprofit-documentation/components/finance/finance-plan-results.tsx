import { DocumentationAiReview } from "../documentation-ai-review"
import DownloadIcon from "lucide-react/dist/esm/icons/download"

import { Button } from "@/components/ui/button"

import type { FinancePlanDraft } from "../../finance-types"
import {
  buildFinanceActions,
  buildFinanceReviewPrompt,
  summarizeFinancePlan,
} from "../../lib/finance-plan"

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const decimal = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
})

function endingLabel(value: number) {
  if (value < 0) return `${currency.format(Math.abs(value))} planning gap`
  return currency.format(value)
}

function FundsView({ draft }: { draft: FinancePlanDraft }) {
  const summary = summarizeFinancePlan(draft)
  const columns = [
    {
      label: "Unrestricted",
      note: "Working classification subject to current records and review.",
      beginning: draft.beginningUnrestrictedCash,
      inflows: draft.plannedUnrestrictedInflows,
      outflows: draft.plannedUnrestrictedOutflows,
      ending: summary.projectedUnrestrictedCash,
    },
    {
      label: "Restricted",
      note: "Kept separate; this tool does not determine allowable use or release.",
      beginning: draft.beginningRestrictedCash,
      inflows: draft.plannedRestrictedInflows,
      outflows: draft.plannedRestrictedOutflows,
      ending: summary.projectedRestrictedCash,
    },
  ]
  return (
    <div className="bg-border grid gap-px overflow-hidden rounded-xl border lg:grid-cols-2">
      {columns.map((column) => (
        <section key={column.label} className="bg-background min-w-0 p-4">
          <p className="text-xs font-semibold tracking-wide uppercase">
            {column.label}
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            {column.note}
          </p>
          <dl className="mt-3 divide-y border-y">
            {[
              ["Beginning cash", currency.format(column.beginning)],
              ["Planned inflows", currency.format(column.inflows)],
              ["Planned outflows", currency.format(column.outflows)],
              ["Projected ending cash", endingLabel(column.ending)],
            ].map(([term, value]) => (
              <div
                key={term}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-3 text-sm"
              >
                <dt className="text-muted-foreground min-w-0">{term}</dt>
                <dd className="font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}

export function FinancePlanResults({
  draft,
  promptCopied,
  onCopyPrompt,
  onDownload,
}: {
  draft: FinancePlanDraft
  promptCopied: boolean
  onCopyPrompt: () => void
  onDownload: () => void
}) {
  const summary = summarizeFinancePlan(draft)
  const actions = buildFinanceActions(draft)
  const prompt = buildFinanceReviewPrompt(draft)
  const coverage =
    summary.averageMonthlyUnrestrictedOutflow > 0 &&
    summary.projectedUnrestrictedCash > 0
      ? `${decimal.format(summary.unrestrictedCoverageMonths)} months`
      : "Not available"

  return (
    <div className="bg-muted/20 border-t p-4 sm:p-4">
      <div className="bg-border grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Planned inflows", currency.format(summary.totalPlannedInflows)],
          ["Planned outflows", currency.format(summary.totalPlannedOutflows)],
          ["Projected total cash", endingLabel(summary.projectedTotalCash)],
          ["Unrestricted coverage", coverage],
        ].map(([label, value]) => (
          <div key={label} className="bg-background p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {label}
            </p>
            <p className="mt-3 text-base font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-3 text-xs leading-5">
        Planning arithmetic only. Totals do not model individual receipt and
        payment dates, probability, receivables, payables, debt, noncash
        activity, accounting treatment, or restrictions. Coverage is projected
        ending unrestricted cash divided by average monthly planned unrestricted
        outflows; it is not reserve adequacy, liquidity, solvency, or a
        going-concern conclusion.
      </p>

      <section className="mt-6" aria-labelledby="finance-funds-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="finance-funds-title" className="font-semibold">
              Working funds view
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Two resource classes remain separate from beginning to projected
              ending cash.
            </p>
          </div>
          <Button type="button" className="min-h-11" onClick={onDownload}>
            <DownloadIcon className="size-4" aria-hidden />
            Download plan CSV
          </Button>
        </div>
        <div className="mt-4">
          <FundsView draft={draft} />
        </div>
      </section>

      <section className="mt-6" aria-labelledby="finance-actions-title">
        <h3 id="finance-actions-title" className="font-semibold">
          Next steps to review
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} review prompts generated from this draft. They are
          not findings, approvals, or financial recommendations.
        </p>
        <div className="mt-4 grid gap-3">
          {actions.map((item, index) => (
            <article key={item.id} className="bg-background border p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="bg-muted flex size-8 shrink-0 items-center justify-center font-mono text-xs tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {item.phase}
                  </p>
                  <p className="mt-2 text-sm leading-5 font-medium">
                    {item.action}
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs leading-5">
                    Evidence to review: {item.evidence}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <DocumentationAiReview
        prompt={prompt}
        copied={promptCopied}
        onCopy={onCopyPrompt}
      />
    </div>
  )
}
