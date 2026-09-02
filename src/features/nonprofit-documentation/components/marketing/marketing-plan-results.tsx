import CheckIcon from "lucide-react/dist/esm/icons/check"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

import { Button } from "@/components/ui/button"

import {
  MARKETING_CHANNELS,
  buildMarketingActions,
  buildMarketingAiPrompt,
  marketingObjectiveLabel,
  summarizeMarketingPlan,
} from "../../lib/marketing-plan"
import type { MarketingPlanDraft } from "../../types"

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
})

function BriefItem({
  label,
  value,
  empty,
}: {
  label: string
  value: string
  empty: string
}) {
  return (
    <div className="bg-background p-4 sm:p-5">
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </p>
      <p className="mt-3 text-sm leading-6 font-medium text-pretty">
        {value || empty}
      </p>
    </div>
  )
}

export function MarketingPlanResults({
  draft,
  copied,
  onCopy,
  onDownload,
}: {
  draft: MarketingPlanDraft
  copied: boolean
  onCopy: () => void
  onDownload: () => void
}) {
  const summary = summarizeMarketingPlan(draft)
  const actions = buildMarketingActions(draft)
  const prompt = buildMarketingAiPrompt(draft)
  const rhythmLabel = summary.activeChannelCount
    ? `${summary.activeChannelCount} active ${summary.activeChannelCount === 1 ? "channel" : "channels"} · ${number.format(summary.weeklyPace)} planned outputs per week`
    : "Add a monthly cadence to include a channel in this period"

  return (
    <div className="bg-muted/20 border-t p-5 sm:p-6">
      <div className="bg-border grid gap-px overflow-hidden border sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active channels", summary.activeChannelCount],
          ["Outputs per month", summary.monthlyOutputs],
          ["Outputs in 90 days", summary.ninetyDayOutputs],
          ["Weekly planning pace", summary.weeklyPace],
        ].map(([label, value]) => (
          <div key={label} className="bg-background p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {label}
            </p>
            <p className="mt-3 text-lg font-semibold tabular-nums">
              {number.format(Number(value))}
            </p>
          </div>
        ))}
      </div>

      <p
        className="bg-background mt-4 border px-4 py-3 text-sm font-medium"
        aria-live="polite"
      >
        {rhythmLabel}
      </p>

      <div className="mt-8">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {marketingObjectiveLabel(draft.objective)}
        </p>
        <h3 className="mt-2 font-semibold">Inform, Inspire, Invite brief</h3>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          Audience: {draft.primaryAudience || "Add one primary audience"}
        </p>
        <div className="bg-border mt-4 grid gap-px overflow-hidden border lg:grid-cols-3">
          <BriefItem
            label="Inform"
            value={draft.mainMessage}
            empty="Add the one sourced message this audience should understand."
          />
          <BriefItem
            label="Inspire"
            value={draft.proofPoint}
            empty="Add a current proof point, consented story, or honest evidence limit."
          />
          <BriefItem
            label="Invite"
            value={draft.invitation}
            empty="Add one voluntary action with a real destination."
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold">90-day channel rhythm</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            User-entered cadence, not a recommended posting frequency.
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
            Planned monthly and ninety-day output cadence by channel
          </caption>
          <thead className="bg-muted/45">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Channel
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Per month
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                In 90 days
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {MARKETING_CHANNELS.map((channel) => (
              <tr key={channel.id}>
                <th scope="row" className="px-4 py-3 font-medium">
                  {channel.label}
                </th>
                <td className="px-4 py-3 text-right tabular-nums">
                  {number.format(draft.channelCadence[channel.id])}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {number.format(draft.channelCadence[channel.id] * 3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold">Stage and channel action plan</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} actions generated from the stage, brief, channel
          rhythm, and publishing checks.
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

      <div className="mt-8 border">
        <div className="bg-muted/35 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Reviewed AI handoff</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Copy structure and safeguards, then review every output yourself.
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
            {copied ? "Copied" : "Copy AI handoff"}
          </Button>
        </div>
        <pre className="max-h-80 overflow-auto p-4 font-mono text-xs leading-5 break-words whitespace-pre-wrap">
          {prompt}
        </pre>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground max-w-xl text-xs leading-5">
          This tool structures source inputs and cadence. It does not predict
          reach, engagement, conversion, participation, fundraising, or impact.
        </p>
        <a
          href="https://www.cdc.gov/ccindex/ccindex.html"
          target="_blank"
          rel="noreferrer"
          className="focus-visible:ring-ring inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          Review the CDC communication index
          <ExternalLinkIcon className="size-4" aria-hidden />
        </a>
      </div>
    </div>
  )
}
