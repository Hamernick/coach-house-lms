import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

import { Button } from "@/components/ui/button"

import {
  buildPartnershipBriefActions,
  buildPartnershipReviewPrompt,
  partnershipModelLabel,
  summarizePartnershipBrief,
} from "../../lib/partnership-brief"
import type { PartnershipBriefDraft } from "../../types"

function AgreementColumn({
  eyebrow,
  title,
  contribution,
  lead,
  emphasis = false,
}: {
  eyebrow: string
  title: string
  contribution: string
  lead: string
  emphasis?: boolean
}) {
  return (
    <div
      className={`min-w-0 p-5 sm:p-6 ${
        emphasis ? "bg-foreground text-background" : "bg-background"
      }`}
    >
      <p
        className={`text-[11px] font-semibold tracking-[0.14em] uppercase ${
          emphasis ? "text-background/65" : "text-muted-foreground"
        }`}
      >
        {eyebrow}
      </p>
      <h4 className="mt-3 text-base font-semibold break-words">{title}</h4>
      <p
        className={`mt-4 text-sm leading-6 break-words ${
          emphasis ? "text-background/80" : "text-muted-foreground"
        }`}
      >
        {contribution}
      </p>
      <p
        className={`mt-5 border-t pt-3 text-xs leading-5 break-words ${
          emphasis ? "border-background/20" : "border-border"
        }`}
      >
        <strong>Lead:</strong> {lead}
      </p>
    </div>
  )
}

function OperatingStep({
  index,
  label,
  detail,
}: {
  index: number
  label: string
  detail: string
}) {
  return (
    <div className="bg-background min-w-0 flex-1 border p-4 sm:min-w-40">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide uppercase">{label}</p>
        <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
          {String(index).padStart(2, "0")}
        </span>
      </div>
      <p className="text-muted-foreground mt-3 text-xs leading-5 break-words">
        {detail}
      </p>
    </div>
  )
}

export function PartnershipBriefResults({
  draft,
  copied,
  onCopy,
  onDownload,
}: {
  draft: PartnershipBriefDraft
  copied: boolean
  onCopy: () => void
  onDownload: () => void
}) {
  const summary = summarizePartnershipBrief(draft)
  const actions = buildPartnershipBriefActions(draft)
  const prompt = buildPartnershipReviewPrompt(draft)

  return (
    <div className="bg-muted/20 border-t p-5 sm:p-6">
      <div className="bg-border grid gap-px overflow-hidden border sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Relationship", partnershipModelLabel(draft.model)],
          ["Initial term", `${draft.termMonths} months`],
          ["Planned reviews", String(summary.reviewMomentCount)],
          [
            "Safeguards selected",
            `${summary.safeguardCount} of ${summary.totalSafeguardCount}`,
          ],
        ].map(([label, value]) => (
          <div key={label} className="bg-background p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {label}
            </p>
            <p className="mt-3 text-base font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <p
        className="bg-background mt-3 border px-4 py-3 text-sm font-medium"
        aria-live="polite"
      >
        {summary.hasReviewableBrief
          ? `${summary.draftedAreaCount} of ${summary.totalAreaCount} planning areas contain working text. The core brief is ready for verification with the partner, affected people, and authorized reviewers.`
          : `${summary.draftedAreaCount} of ${summary.totalAreaCount} planning areas contain working text. Draft the shared purpose, both contributions, joint work, decision rights, and closeout plan before review.`}
      </p>

      <section className="mt-8" aria-labelledby="agreement-table-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Live sandbox
            </p>
            <h3 id="agreement-table-title" className="mt-2 font-semibold">
              Partnership agreement table
            </h3>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
              Mutual value requires visible contributions on both sides and a
              shared purpose shaped with the people affected.
            </p>
          </div>
          <Button type="button" className="min-h-11" onClick={onDownload}>
            <DownloadIcon className="size-4" aria-hidden /> Download brief CSV
          </Button>
        </div>
        <div className="bg-border mt-5 grid gap-px border lg:grid-cols-[1fr_1.2fr_1fr]">
          <AgreementColumn
            eyebrow="Your side"
            title={draft.organizationName || "Your organization"}
            contribution={
              draft.organizationContribution ||
              "Define your contribution, limits, dependencies, and full cost."
            }
            lead={draft.organizationLead || "Name a lead and backup."}
          />
          <AgreementColumn
            eyebrow="Shared table"
            title={draft.sharedPurpose || "Define the shared public benefit"}
            contribution={
              draft.communityRole ||
              "Define how affected people shape, access, interpret, and challenge the work."
            }
            lead={
              draft.jointActivities ||
              "Define the joint activities and handoffs."
            }
            emphasis
          />
          <AgreementColumn
            eyebrow="Partner side"
            title={draft.partnerName || "Potential partner"}
            contribution={
              draft.partnerContribution ||
              "Record what the partner proposed and what must be confirmed."
            }
            lead={draft.partnerLead || "Confirm a lead and backup."}
          />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="operating-loop-title">
        <h3 id="operating-loop-title" className="font-semibold">
          Operating and learning loop
        </h3>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          Review every {draft.reviewEveryMonths} months during the initial
          {` ${draft.termMonths}-month`} term. A calendar and final agreement
          must establish actual dates.
        </p>
        <div className="mt-5 overflow-x-auto">
          <div className="flex flex-col sm:min-w-[62rem] sm:flex-row sm:items-stretch">
            <OperatingStep
              index={1}
              label="Decide"
              detail={draft.decisionRights || "Define authority and approvals."}
            />
            <ArrowRightIcon
              className="text-muted-foreground m-2 size-4 shrink-0 rotate-90 self-center sm:rotate-0"
              aria-hidden
            />
            <OperatingStep
              index={2}
              label="Deliver"
              detail={
                draft.jointActivities || "Define activities and handoffs."
              }
            />
            <ArrowRightIcon
              className="text-muted-foreground m-2 size-4 shrink-0 rotate-90 self-center sm:rotate-0"
              aria-hidden
            />
            <OperatingStep
              index={3}
              label="Learn"
              detail={
                draft.intendedResult || "Define evidence and limitations."
              }
            />
            <ArrowRightIcon
              className="text-muted-foreground m-2 size-4 shrink-0 rotate-90 self-center sm:rotate-0"
              aria-hidden
            />
            <OperatingStep
              index={4}
              label="Adapt"
              detail={draft.conflictPath || "Define concerns and escalation."}
            />
            <ArrowRightIcon
              className="text-muted-foreground m-2 size-4 shrink-0 rotate-90 self-center sm:rotate-0"
              aria-hidden
            />
            <OperatingStep
              index={5}
              label="Renew or close"
              detail={draft.closeoutPlan || "Define renewal or closeout."}
            />
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="partnership-actions-title">
        <h3 id="partnership-actions-title" className="font-semibold">
          Stage and brief action plan
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} actions generated from stage, drafted terms, and
          planned safeguards.
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
        aria-labelledby="partnership-review-title"
      >
        <div className="bg-muted/35 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h3 id="partnership-review-title" className="text-sm font-semibold">
              Guarded partnership review
            </h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Copy the brief with explicit anti-invention and
              professional-review constraints.
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
          A working brief is not a signed agreement. Verify every representation
          with the other party and obtain review proportionate to the
          arrangement.
        </p>
        <a
          href="https://archive.cdc.gov/www_cdc_gov/sixeighteen/resources/assessment/resources/index.html"
          target="_blank"
          rel="noreferrer"
          className="focus-visible:ring-ring inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          Review CDC partnership evaluation guidance
          <ExternalLinkIcon className="size-4" aria-hidden />
        </a>
      </div>
    </div>
  )
}
