import { DocumentationAiReview } from "../documentation-ai-review"
import DownloadIcon from "lucide-react/dist/esm/icons/download"

import { Button } from "@/components/ui/button"

import {
  buildHrActions,
  buildHrReviewPrompt,
  hrRelationshipLabel,
} from "../../lib/hr-plan"
import type { HrPlanDraft } from "../../hr-types"

function valueOrPrompt(value: string, prompt: string) {
  return value.trim() || prompt
}

function RoleBrief({ draft }: { draft: HrPlanDraft }) {
  const sections = [
    [
      "Mission need",
      valueOrPrompt(
        draft.missionNeed,
        "Define the mission or program need before publishing this role."
      ),
    ],
    [
      "Outcomes",
      valueOrPrompt(
        draft.roleOutcomes,
        "Describe the observable results this role should support."
      ),
    ],
    [
      "Essential functions",
      valueOrPrompt(
        draft.essentialFunctions,
        "List necessary work, authority, demands, and boundaries."
      ),
    ],
    [
      "Qualifications",
      valueOrPrompt(
        draft.qualifications,
        "Name job-related evidence and what can be learned through training."
      ),
    ],
    [
      "Schedule and location",
      valueOrPrompt(
        draft.scheduleLocation,
        "Describe how, when, where, and with what direction the work occurs."
      ),
    ],
    [
      "Compensation and resources",
      valueOrPrompt(
        draft.compensationResources,
        "Document compensation assumptions, full cost, funding, and approval."
      ),
    ],
  ]
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="bg-foreground text-background p-4 sm:p-4">
        <p className="text-background/70 text-xs font-semibold tracking-wide uppercase">
          {hrRelationshipLabel(draft.relationship)} · {draft.reviewDays}-day
          review
        </p>
        <h3 className="mt-3 text-base font-semibold text-balance">
          {draft.roleTitle || "Working role title"}
        </h3>
        <p className="text-background/75 mt-2 text-sm">
          {draft.organizationName || "Organization not named"}
        </p>
      </div>
      <dl className="divide-y">
        {sections.map(([term, description]) => (
          <div key={term} className="grid gap-2 p-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm font-semibold">{term}</dt>
            <dd className="text-muted-foreground min-w-0 text-sm leading-5 break-words">
              {description}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function HrPlanResults({
  draft,
  promptCopied,
  onCopyPrompt,
  onDownload,
}: {
  draft: HrPlanDraft
  promptCopied: boolean
  onCopyPrompt: () => void
  onDownload: () => void
}) {
  const actions = buildHrActions(draft)
  const prompt = buildHrReviewPrompt(draft)

  return (
    <div className="bg-muted/20 border-t p-4 sm:p-4">
      <section className="mt-6" aria-labelledby="hr-role-brief-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="hr-role-brief-title" className="font-semibold">
              Working role brief
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              A planning view, not an approved posting, contract, policy, or
              personnel record.
            </p>
          </div>
          <Button type="button" className="min-h-11" onClick={onDownload}>
            <DownloadIcon className="size-4" aria-hidden />
            Download brief CSV
          </Button>
        </div>
        <div className="mt-4">
          <RoleBrief draft={draft} />
        </div>
      </section>

      <section className="mt-6" aria-labelledby="hr-actions-title">
        <h3 id="hr-actions-title" className="font-semibold">
          Next steps to review
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} actions generated from this draft. They are review
          prompts, not findings or approvals.
        </p>
        <div className="mt-4 grid gap-3">
          {actions.map((item, index) => (
            <article
              key={item.id}
              className="bg-background rounded-xl border p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-xs tabular-nums">
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
