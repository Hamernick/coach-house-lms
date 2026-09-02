import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

import { Button } from "@/components/ui/button"

import {
  FUNDRAISING_CHANNELS,
  buildFundraisingActions,
  summarizeFundraisingPlan,
} from "../../lib/fundraising-plan"
import type { FundraisingPlanDraft } from "../../types"

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
})

export function FundraisingPlanResults({
  draft,
  onDownload,
}: {
  draft: FundraisingPlanDraft
  onDownload: () => void
}) {
  const summary = summarizeFundraisingPlan(draft)
  const actions = buildFundraisingActions(draft)
  const balanceLabel = summary.remainingGap
    ? `${currency.format(summary.remainingGap)} remains unallocated`
    : summary.overplannedAmount
      ? `${currency.format(summary.overplannedAmount)} planned above the current need`
      : summary.fundingNeed
        ? "Planned channels match the current fundraising need"
        : "Add a funding goal to calculate the plan"

  return (
    <div className="bg-muted/20 border-t p-5 sm:p-6">
      <div className="bg-border grid gap-px overflow-hidden border sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Fundraising need", summary.fundingNeed],
          ["Planned by channel", summary.plannedTotal],
          ["Remaining gap", summary.remainingGap],
          ["Monthly planning pace", summary.monthlyPace],
        ].map(([label, value]) => (
          <div key={label} className="bg-background p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {label}
            </p>
            <p className="mt-3 text-lg font-semibold tabular-nums">
              {currency.format(Number(value))}
            </p>
          </div>
        ))}
      </div>

      <p
        className="bg-background mt-4 border px-4 py-3 text-sm font-medium"
        aria-live="polite"
      >
        {balanceLabel}
      </p>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold">Funding mix</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Planned amounts remain assumptions until support is committed.
          </p>
        </div>
        <Button type="button" className="min-h-11" onClick={onDownload}>
          <DownloadIcon className="size-4" aria-hidden />
          Download plan CSV
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto border">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Planned fundraising amount and share of need by channel
          </caption>
          <thead className="bg-muted/45">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Channel
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Planned amount
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Share of need
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {FUNDRAISING_CHANNELS.map((channel) => {
              const amount = draft.channelTargets[channel.id]
              const share = summary.fundingNeed
                ? amount / summary.fundingNeed
                : 0
              return (
                <tr key={channel.id}>
                  <th scope="row" className="px-4 py-3 font-medium">
                    {channel.label}
                  </th>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {currency.format(amount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {percent.format(share)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold">Stage and channel action plan</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} actions generated from the selected stage, channels,
          and readiness checks.
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
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground max-w-xl text-xs leading-5">
          This tool organizes assumptions. It does not predict awards, gifts,
          timing, donor behavior, eligibility, or legal requirements.
        </p>
        <a
          href="https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-solicitation-state-requirements"
          target="_blank"
          rel="noreferrer"
          className="focus-visible:ring-ring inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          Review state solicitation guidance
          <ExternalLinkIcon className="size-4" aria-hidden />
        </a>
      </div>
    </div>
  )
}
