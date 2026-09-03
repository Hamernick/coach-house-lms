import CheckIcon from "lucide-react/dist/esm/icons/check"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import DownloadIcon from "lucide-react/dist/esm/icons/download"

import { Button } from "@/components/ui/button"

import {
  HR_LIFECYCLE,
  buildHrActions,
  buildHrReviewPrompt,
  hrRelationshipLabel,
  summarizeHrPlan,
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
    <div className="overflow-hidden border">
      <div className="bg-foreground text-background p-5 sm:p-6">
        <p className="text-background/70 text-xs font-semibold tracking-wide uppercase">
          {hrRelationshipLabel(draft.relationship)} · {draft.reviewDays}-day
          review
        </p>
        <h3 className="mt-3 text-xl font-semibold text-balance">
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
            <dd className="text-muted-foreground min-w-0 text-sm leading-6 break-words">
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
  const summary = summarizeHrPlan(draft)
  const actions = buildHrActions(draft)
  const prompt = buildHrReviewPrompt(draft)

  return (
    <div className="bg-muted/20 border-t p-5 sm:p-6">
      <div className="bg-border grid gap-px overflow-hidden border sm:grid-cols-3">
        {[
          [
            "Drafted areas",
            `${summary.draftedAreaCount}/${summary.totalAreaCount}`,
          ],
          [
            "Lifecycle steps",
            `${summary.lifecycleStepCount}/${summary.totalLifecycleStepCount}`,
          ],
          [
            "Safeguards",
            `${summary.safeguardCount}/${summary.totalSafeguardCount}`,
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
        Counts describe this draft. They do not establish worker status,
        compliance, authorization, accessibility, safety, fairness, readiness,
        performance, or a valid employment decision.
      </p>

      <section className="mt-8" aria-labelledby="hr-lifecycle-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="hr-lifecycle-title" className="font-semibold">
              Live role lifecycle
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Each step becomes complete only when its working fields contain a
              draft. Human review still applies.
            </p>
          </div>
          <span className="bg-background border px-3 py-1 text-xs font-medium">
            Device-local · Makes no decisions
          </span>
        </div>
        <ol className="bg-border mt-4 grid gap-px overflow-hidden border sm:grid-cols-2 lg:grid-cols-6">
          {HR_LIFECYCLE.map((step, index) => {
            const complete = step.fields.every(
              (field) => String(draft[field]).trim().length > 0
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

      <section className="mt-8" aria-labelledby="hr-role-brief-title">
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

      <section className="mt-8" aria-labelledby="hr-actions-title">
        <h3 id="hr-actions-title" className="font-semibold">
          Stage and missing-brief actions
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} actions generated from this draft. They are review
          prompts, not findings or approvals.
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

      <section className="mt-8 border p-4 sm:p-5" aria-labelledby="hr-ai-title">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Optional human-reviewed handoff
        </p>
        <h3 id="hr-ai-title" className="mt-2 font-semibold">
          Copy a guarded AI review prompt
        </h3>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          The prompt asks an AI system to expose missing facts and review
          questions. Remove confidential, personal, medical, immigration,
          applicant, worker, participant, investigation, and case information
          before using another service.
        </p>
        <pre className="bg-muted/40 mt-4 max-h-56 overflow-auto border p-4 text-xs leading-5 whitespace-pre-wrap">
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
