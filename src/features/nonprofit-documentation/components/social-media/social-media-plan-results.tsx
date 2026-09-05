import { DocumentationAiReview } from "../documentation-ai-review"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import DownloadIcon from "lucide-react/dist/esm/icons/download"

import { Button } from "@/components/ui/button"

import {
  SOCIAL_MEDIA_CHANNELS,
  buildSocialMediaActions,
  buildSocialMediaReviewPrompt,
  buildTrackedSocialUrl,
  socialMediaChannelLabel,
  socialMediaObjectiveLabel,
  summarizeSocialMediaPlan,
} from "../../lib/social-media-plan"
import type { SocialMediaPlanDraft } from "../../types"

const number = new Intl.NumberFormat("en-US")

function ContentPathItem({
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
    <div className="bg-background grid gap-3 p-4 sm:grid-cols-[2rem_1fr] sm:p-5">
      <span className="text-muted-foreground font-mono text-xs tabular-nums">
        {String(index).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {label}
        </p>
        <p className="mt-2 text-sm leading-5 font-medium break-words">
          {value || empty}
        </p>
      </div>
    </div>
  )
}

export function SocialMediaPlanResults({
  draft,
  promptCopied,
  linkCopied,
  onCopyPrompt,
  onCopyLink,
  onDownload,
}: {
  draft: SocialMediaPlanDraft
  promptCopied: boolean
  linkCopied: boolean
  onCopyPrompt: () => void
  onCopyLink: (value: string) => void
  onDownload: () => void
}) {
  const summary = summarizeSocialMediaPlan(draft)
  const actions = buildSocialMediaActions(draft)
  const prompt = buildSocialMediaReviewPrompt(draft)
  const tracked = buildTrackedSocialUrl(
    draft.destinationUrl,
    draft.previewChannel,
    draft.campaignName
  )
  const organization = draft.organizationName || "Untitled nonprofit"
  const previewCopy =
    draft.postCopy ||
    "Draft post copy will appear here. Keep the source meaning, relevant limits, and one useful action visible."

  return (
    <div className="bg-muted/20 border-t p-4 sm:p-4">
      <div className="bg-border grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Active channels", summary.activeChannelCount],
          ["Outputs per week", summary.weeklyOutputs],
          ["Campaign outputs", summary.campaignOutputs],
        ].map(([label, value]) => (
          <div key={label} className="bg-background p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {label}
            </p>
            <p className="mt-3 text-base font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-6" aria-labelledby="social-preview-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Planning preview · {socialMediaChannelLabel(draft.previewChannel)}
            </p>
            <h3 id="social-preview-title" className="mt-2 font-semibold">
              Generic post preview
            </h3>
          </div>
          <span className="bg-background border px-3 py-1 text-xs font-medium">
            Not connected · Not published
          </span>
        </div>
        <div className="bg-background mt-4 overflow-hidden border shadow-sm">
          <div className="flex items-center gap-3 border-b p-4">
            <div
              className="bg-foreground text-background grid size-10 shrink-0 place-items-center font-semibold"
              aria-hidden
            >
              {organization.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{organization}</p>
              <p className="text-muted-foreground text-xs">Working draft</p>
            </div>
          </div>
          <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(15rem,0.9fr)]">
            <div className="p-4 sm:p-4">
              <p className="text-sm leading-6 break-words whitespace-pre-wrap">
                {previewCopy}
              </p>
              <div className="mt-3 border-t pt-4">
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  Link label
                </p>
                <p className="mt-2 text-sm font-semibold break-words underline underline-offset-4">
                  {draft.linkLabel || "Add descriptive link text"}
                </p>
              </div>
            </div>
            <div className="bg-muted/45 border-t p-4 lg:border-t-0 lg:border-l">
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Visual direction
              </p>
              <p className="mt-3 text-sm leading-5 break-words">
                {draft.visualDescription || "Add a purposeful visual plan."}
              </p>
              <p className="text-muted-foreground mt-3 text-xs font-semibold uppercase">
                Alternative text
              </p>
              <p className="mt-3 text-sm leading-5 break-words">
                {draft.alternativeText ||
                  "Add relevant alternative text or document why the visual is decorative."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6" aria-labelledby="content-path-title">
        <h3 id="content-path-title" className="font-semibold">
          Source-to-action path
        </h3>
        <div className="bg-border mt-4 grid gap-px overflow-hidden rounded-xl border lg:grid-cols-3">
          <ContentPathItem
            index={1}
            label="Message"
            value={draft.mainMessage}
            empty="Add the one sourced message this audience should understand."
          />
          <ContentPathItem
            index={2}
            label="Evidence or limit"
            value={draft.sourceEvidence}
            empty="Add the source, owner, review date, support, and limitation."
          />
          <ContentPathItem
            index={3}
            label="Invitation"
            value={draft.desiredAction}
            empty="Add one voluntary action the audience can complete."
          />
        </div>
      </section>

      <section className="mt-6" aria-labelledby="tracked-link-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="tracked-link-title" className="font-semibold">
              Tracked-link preview
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Adds source, social medium, and a campaign slug locally.
            </p>
          </div>
          {tracked.ok ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => onCopyLink(tracked.url)}
            >
              {linkCopied ? (
                <CheckIcon className="size-4" aria-hidden />
              ) : (
                <CopyIcon className="size-4" aria-hidden />
              )}
              {linkCopied ? "Copied" : "Copy tracked link"}
            </Button>
          ) : null}
        </div>
        <div
          className={`mt-4 border p-4 ${tracked.ok ? "bg-background" : "border-amber-500/60 bg-amber-500/8"}`}
          aria-live="polite"
        >
          {tracked.ok ? (
            <code className="block font-mono text-xs leading-5 break-all">
              {tracked.url}
            </code>
          ) : (
            <p className="text-sm font-medium">{tracked.error}</p>
          )}
        </div>
      </section>

      <section className="mt-6" aria-labelledby="channel-rhythm-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="channel-rhythm-title" className="font-semibold">
              Channel rhythm
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              User-entered planning assumptions for {draft.campaignWeeks} weeks.
            </p>
          </div>
          <Button type="button" className="min-h-11" onClick={onDownload}>
            <DownloadIcon className="size-4" aria-hidden />
            Download brief CSV
          </Button>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              User-entered weekly and campaign output cadence by social channel
            </caption>
            <thead className="bg-muted/45">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Channel
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Per week
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Campaign
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {SOCIAL_MEDIA_CHANNELS.map((channel) => (
                <tr key={channel.id}>
                  <th scope="row" className="px-4 py-3 font-medium">
                    {channel.label}
                  </th>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {number.format(draft.channelCadence[channel.id])}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {number.format(
                      draft.channelCadence[channel.id] * draft.campaignWeeks
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6" aria-labelledby="social-actions-title">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {socialMediaObjectiveLabel(draft.objective)}
        </p>
        <h3 id="social-actions-title" className="mt-2 font-semibold">
          Next steps to review
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} actions generated from this draft. They are review
          prompts, not approval findings.
        </p>
        <ol className="mt-4 divide-y border-y">
          {actions.map((item, index) => (
            <li
              key={item.id}
              className="grid gap-3 py-3 sm:grid-cols-[2.5rem_minmax(0,1fr)]"
            >
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <span className="bg-muted border px-2 py-0.5 text-[11px] font-medium">
                  {item.phase}
                </span>
                <p className="mt-3 text-sm leading-5 font-semibold">
                  {item.action}
                </p>
                <p className="text-muted-foreground mt-2 text-sm leading-5">
                  <strong className="text-foreground">Keep:</strong>{" "}
                  {item.evidence}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <DocumentationAiReview
        prompt={prompt}
        copied={promptCopied}
        onCopy={onCopyPrompt}
      />

      <p className="text-muted-foreground mt-3 text-xs leading-5">
        This tool stores a working draft on this device. It does not connect to
        an account, publish, approve content, or determine compliance,
        accessibility, permission, rights, safety, or likely performance.
      </p>
    </div>
  )
}
