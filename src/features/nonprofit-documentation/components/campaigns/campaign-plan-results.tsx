import CheckIcon from "lucide-react/dist/esm/icons/check"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import DownloadIcon from "lucide-react/dist/esm/icons/download"

import { Button } from "@/components/ui/button"

import type { CampaignPlanDraft } from "../../campaign-types"
import {
  CAMPAIGN_PATHWAY,
  buildCampaignActions,
  buildCampaignReviewPrompt,
  campaignTypeLabel,
  summarizeCampaignPlan,
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
    <div className="overflow-hidden border">
      <div className="bg-foreground text-background p-5 sm:p-6">
        <p className="text-background/70 text-xs font-semibold tracking-wide uppercase">
          {campaignTypeLabel(draft.campaignType)}
        </p>
        <h3 className="mt-3 text-xl font-semibold text-balance">
          {draft.campaignName || "Working campaign"}
        </h3>
        <div className="text-background/75 mt-2 flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-3">
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
        {sections.map(([term, description]) => (
          <div key={term} className="grid gap-2 p-4 sm:grid-cols-[12rem_1fr]">
            <dt className="text-sm font-semibold">{term}</dt>
            <dd className="text-muted-foreground min-w-0 text-sm leading-6 break-words whitespace-pre-line">
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
  const summary = summarizeCampaignPlan(draft)
  const actions = buildCampaignActions(draft)
  const prompt = buildCampaignReviewPrompt(draft)

  return (
    <div className="bg-muted/20 border-t p-5 sm:p-6">
      <section aria-labelledby="campaign-status-title">
        <h3 id="campaign-status-title" className="font-semibold">
          Draft status
        </h3>
        <div className="bg-border mt-4 grid gap-px overflow-hidden border sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Drafted areas",
              `${summary.draftedAreaCount}/${summary.totalAreaCount}`,
            ],
            [
              "Campaign steps",
              `${summary.pathwayStepCount}/${summary.totalPathwayStepCount}`,
            ],
            [
              "Safeguards",
              `${summary.safeguardCount}/${summary.totalSafeguardCount}`,
            ],
            [
              "Working duration",
              summary.durationDays === null
                ? "Review dates"
                : `${summary.durationDays} days`,
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
        <p className="text-muted-foreground mt-3 text-xs leading-5">
          Counts describe this draft. They do not score or establish accuracy,
          authority, evidence, permission, compliance, access, capacity,
          delivery, performance, attribution, or impact.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="campaign-pathway-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="campaign-pathway-title" className="font-semibold">
              Live campaign chain
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              A step becomes Drafted only when every named working area contains
              text. Human review still applies.
            </p>
          </div>
          <span className="bg-background border px-3 py-1 text-xs font-medium">
            Device-local · Publishes nothing
          </span>
        </div>
        <ol className="bg-border mt-4 grid gap-px overflow-hidden border sm:grid-cols-2 lg:grid-cols-7">
          {CAMPAIGN_PATHWAY.map((step, index) => {
            const complete = step.fields.every((field) =>
              String(draft[field]).trim()
            )
            return (
              <li key={step.id} className="bg-background min-w-0 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-muted-foreground text-[11px] font-medium">
                    {complete ? "Drafted" : "Open"}
                  </span>
                </div>
                <h4 className="mt-3 text-sm font-semibold">{step.label}</h4>
                <p className="text-muted-foreground mt-2 text-xs leading-5">
                  {step.description}
                </p>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="mt-8" aria-labelledby="campaign-brief-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="campaign-brief-title" className="font-semibold">
              Working campaign brief
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              A planning record, not approved content, authority, legal advice,
              audience research, or evidence of results.
            </p>
          </div>
          <Button type="button" className="min-h-11" onClick={onDownload}>
            <DownloadIcon className="size-4" aria-hidden />
            Download brief CSV
          </Button>
        </div>
        <div className="mt-4">
          <CampaignBrief draft={draft} />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="campaign-actions-title">
        <h3 id="campaign-actions-title" className="font-semibold">
          Stage and missing-brief actions
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} review prompts generated from this draft. They are
          not findings, approvals, requirements, or performance advice.
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
                  <p className="mt-2 text-sm leading-6 font-medium">
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

      <section
        className="mt-8 border p-4 sm:p-5"
        aria-labelledby="campaign-ai-title"
      >
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Optional human-reviewed handoff
        </p>
        <h3 id="campaign-ai-title" className="mt-2 font-semibold">
          Copy a guarded AI review prompt
        </h3>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          The prompt asks an AI system to expose gaps and review questions.
          Remove personal, participant, donor, worker, health, contact,
          credential, protected-report, and other sensitive information before
          using another service.
        </p>
        <pre className="bg-muted/40 mt-4 max-h-56 overflow-auto border p-4 text-xs leading-5 break-words whitespace-pre-wrap">
          {prompt}
        </pre>
        <Button
          type="button"
          variant="outline"
          className="mt-4 min-h-11"
          onClick={onCopyPrompt}
        >
          {promptCopied ? (
            <CheckIcon className="size-4" aria-hidden />
          ) : (
            <CopyIcon className="size-4" aria-hidden />
          )}
          {promptCopied ? "Prompt copied" : "Copy review prompt"}
        </Button>
      </section>
    </div>
  )
}
