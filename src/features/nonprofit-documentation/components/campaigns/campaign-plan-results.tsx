import { DocumentationAiReview } from "../documentation-ai-review"
import DownloadIcon from "lucide-react/dist/esm/icons/download"

import { Button } from "@/components/ui/button"

import type { CampaignPlanDraft } from "../../campaign-types"
import {
  buildCampaignActions,
  buildCampaignReviewPrompt,
  campaignTypeLabel,
} from "../../lib/campaign-plan"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
})

function dateLabel(value: string) {
  if (!value) return "Open"
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime())
    ? "Review date"
    : dateFormatter.format(date)
}

function CampaignBrief({ draft }: { draft: CampaignPlanDraft }) {
  const sections: Array<[string, string]> = [
    ["Objective and decision", draft.objective],
    ["Primary audience", draft.primaryAudience],
    ["Audience evidence and unknowns", draft.audienceEvidence],
    ["Observable action", draft.desiredAction],
    ["Main message", draft.mainMessage],
    ["Supporting evidence and limits", draft.supportingEvidence],
    ["Offer and destination", draft.offerDestination],
    ["Channel and partner roles", draft.channelRoles],
    ["Timeline and milestones", draft.timelineMilestones],
    ["Budget and capacity", draft.budgetCapacity],
    ["Owners and approvals", draft.ownersApprovals],
    ["Accessibility and language", draft.accessibilityLanguage],
    ["Consent and privacy", draft.consentPrivacy],
    ["Legal, tax, funding, and channel review", draft.complianceReview],
    ["Response and escalation", draft.responseEscalation],
    ["Measurement and limitations", draft.measurementPlan],
    ["Learning decision", draft.learningDecision],
  ]

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="bg-foreground text-background p-4 sm:p-4">
        <p className="text-background/70 text-xs font-semibold tracking-normal">
          {campaignTypeLabel(draft.campaignType)}
        </p>
        <h3 className="mt-1 text-base font-semibold text-balance">
          {draft.campaignName || "Working campaign"}
        </h3>
        <div className="text-background/75 mt-1 flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-3">
          <span>{draft.organizationName || "Organization not named"}</span>
          <span className="hidden sm:inline" aria-hidden>
            ·
          </span>
          <span>
            {dateLabel(draft.startDate)}–{dateLabel(draft.endDate)}
          </span>
        </div>
      </div>
      <dl className="divide-y">
        {sections
          .filter(([, value]) => value.trim())
          .map(([term, description]) => (
            <div key={term} className="grid gap-2 p-4 sm:grid-cols-[12rem_1fr]">
              <dt className="text-sm font-semibold">{term}</dt>
              <dd className="text-muted-foreground min-w-0 text-sm leading-5 break-words whitespace-pre-line">
                {description || "Open"}
              </dd>
            </div>
          ))}
      </dl>
    </div>
  )
}

export function CampaignPlanResults({
  draft,
  promptCopied,
  onCopyPrompt,
  onDownload,
}: {
  draft: CampaignPlanDraft
  promptCopied: boolean
  onCopyPrompt: () => void
  onDownload: () => void
}) {
  const actions = buildCampaignActions(draft)
  const prompt = buildCampaignReviewPrompt(draft)

  return (
    <div className="bg-muted/20 border-t p-4 sm:p-4">
      <section className="mt-6" aria-labelledby="campaign-brief-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="campaign-brief-title" className="font-semibold">
              Working campaign brief
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Review this brief with the people responsible for delivery.
            </p>
          </div>
          <Button
            type="button"
            className="min-h-11 rounded-full"
            onClick={onDownload}
          >
            <DownloadIcon className="size-4" aria-hidden />
            Download brief CSV
          </Button>
        </div>
        <div className="mt-4">
          <CampaignBrief draft={draft} />
        </div>
      </section>

      <section className="mt-6" aria-labelledby="campaign-actions-title">
        <h3 id="campaign-actions-title" className="font-semibold">
          Next steps to review
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Use these questions to review the plan with your team.
        </p>
        <div className="mt-4 grid gap-3">
          {actions.map((item, index) => (
            <article key={item.id} className="border-b py-4">
              <div className="flex items-start gap-3">
                <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-xs tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs font-semibold tracking-normal">
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
