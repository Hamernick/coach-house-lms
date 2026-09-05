import { DocumentationAiReview } from "../documentation-ai-review"
import DownloadIcon from "lucide-react/dist/esm/icons/download"

import { Button } from "@/components/ui/button"

import {
  buildLegalActions,
  buildLegalReviewPrompt,
  legalCategoryLabel,
  legalUrgencyLabel,
} from "../../lib/legal-plan"
import type { LegalPlanDraft } from "../../legal-types"

function valueOrPrompt(value: string, prompt: string) {
  return value.trim() || prompt
}

function MatterBrief({ draft }: { draft: LegalPlanDraft }) {
  const sections = [
    [
      "Decision question",
      valueOrPrompt(
        draft.decisionQuestion,
        "State the decision or response that requires qualified review."
      ),
    ],
    [
      "Known facts",
      valueOrPrompt(
        draft.knownFacts,
        "Record first-hand facts, attributed statements, dates, and sources."
      ),
    ],
    [
      "Unknowns",
      valueOrPrompt(
        draft.assumptionsUnknowns,
        "Separate assumptions, disputed claims, missing facts, and open questions."
      ),
    ],
    [
      "Affected people",
      valueOrPrompt(
        draft.affectedPeople,
        "Identify affected people, decision-makers, reporters, witnesses, and counterparties."
      ),
    ],
    [
      "Jurisdiction and timing",
      [draft.jurisdictionsLocations, draft.timelineDeadlines]
        .filter((value) => value.trim())
        .join("\n\n") ||
        "Map every relevant location and copy all stated dates exactly.",
    ],
    [
      "Authority and referral",
      [draft.authorityConflicts, draft.counselReferral]
        .filter((value) => value.trim())
        .join("\n\n") ||
        "Identify authority, conflicts, recusals, and qualified counsel needs.",
    ],
  ]

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="bg-foreground text-background p-4 sm:p-4">
        <p className="text-background/70 text-xs font-semibold tracking-wide uppercase">
          {legalCategoryLabel(draft.category)}
        </p>
        <h3 className="mt-3 text-base font-semibold text-balance">
          {draft.matterTitle || "Working legal matter"}
        </h3>
        <div className="text-background/75 mt-2 flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-3">
          <span>{draft.organizationName || "Organization not named"}</span>
          <span className="hidden sm:inline" aria-hidden>
            ·
          </span>
          <span>{legalUrgencyLabel(draft.urgency)}</span>
        </div>
      </div>
      <dl className="divide-y">
        {sections.map(([term, description]) => (
          <div key={term} className="grid gap-2 p-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm font-semibold">{term}</dt>
            <dd className="text-muted-foreground min-w-0 text-sm leading-5 break-words whitespace-pre-line">
              {description}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function LegalPlanResults({
  draft,
  promptCopied,
  onCopyPrompt,
  onDownload,
}: {
  draft: LegalPlanDraft
  promptCopied: boolean
  onCopyPrompt: () => void
  onDownload: () => void
}) {
  const actions = buildLegalActions(draft)
  const prompt = buildLegalReviewPrompt(draft)

  return (
    <div className="bg-muted/20 border-t p-4 sm:p-4">
      {draft.urgency === "immediate-safety" ? (
        <section
          className="bg-foreground text-background mt-6 rounded-xl border p-4 sm:p-5"
          aria-labelledby="legal-urgent-result-title"
        >
          <p className="text-background/70 text-xs font-semibold tracking-wide uppercase">
            Immediate routing selected
          </p>
          <h3 id="legal-urgent-result-title" className="mt-2 font-semibold">
            Protect people and use qualified channels now
          </h3>
          <p className="text-background/75 mt-2 text-sm leading-5">
            Do not delay emergency, safeguarding, incident-response, insurer,
            regulator, or qualified legal contact to finish this tool. The
            selection records your description; it does not determine a legal
            duty or response.
          </p>
        </section>
      ) : null}

      <section className="mt-6" aria-labelledby="legal-matter-brief-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="legal-matter-brief-title" className="font-semibold">
              Working matter brief
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              A planning view, not legal advice, a legal hold, an investigation
              record, or a communication with counsel.
            </p>
          </div>
          <Button type="button" className="min-h-11" onClick={onDownload}>
            <DownloadIcon className="size-4" aria-hidden />
            Download brief CSV
          </Button>
        </div>
        <div className="mt-4">
          <MatterBrief draft={draft} />
        </div>
      </section>

      <section className="mt-6" aria-labelledby="legal-actions-title">
        <h3 id="legal-actions-title" className="font-semibold">
          Next steps to review
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} actions generated from this draft. They are issue and
          referral prompts, not findings, deadlines, duties, or advice.
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
