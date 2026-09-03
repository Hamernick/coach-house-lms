import CheckIcon from "lucide-react/dist/esm/icons/check"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import DownloadIcon from "lucide-react/dist/esm/icons/download"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { CrmPlanDraft } from "../../crm-types"
import {
  CRM_LIFECYCLE,
  buildCrmActions,
  buildCrmReviewPrompt,
  crmFieldCategoryLabel,
  crmFieldSensitivityLabel,
  crmRelationshipContextLabel,
  summarizeCrmPlan,
} from "../../lib/crm-plan"

function CrmOperatingBrief({ draft }: { draft: CrmPlanDraft }) {
  const sections: Array<[string, string]> = [
    ["System purpose and decisions", draft.systemPurpose],
    ["People, accountability, and authority", draft.peopleAndDecisions],
    ["Record boundary", draft.recordBoundary],
    ["Collection, source, notice, and consent", draft.collectionNoticeConsent],
    ["Communication preferences", draft.communicationPreferences],
    ["Identity and duplicate handling", draft.identityDeduplication],
    ["Relationship stages", draft.relationshipLifecycle],
    ["Access roles", draft.accessRoles],
    ["Data quality and correction", draft.dataQualityCorrection],
    ["Retention, preservation, and deletion", draft.retentionDeletion],
    ["Integrations, exports, and service providers", draft.integrationsExports],
    ["Security and incident response", draft.securityIncident],
    ["Accessibility and language", draft.accessibilityLanguage],
    ["Reporting, learning, and decisions", draft.reportingDecision],
    ["Vendor and migration requirements", draft.vendorMigration],
  ]

  return (
    <div className="overflow-hidden border">
      <div className="bg-foreground text-background p-5 sm:p-6">
        <p className="text-background/70 text-xs font-semibold tracking-wide uppercase">
          {crmRelationshipContextLabel(draft.relationshipContext)}
        </p>
        <h3 className="mt-3 text-xl font-semibold text-balance">
          {draft.planName || "Working CRM data-stewardship plan"}
        </h3>
        <p className="text-background/75 mt-2 text-sm">
          {draft.organizationName || "Organization not named"} · Review every{" "}
          <span className="tabular-nums">{draft.reviewMonths} months</span>
        </p>
      </div>
      <dl className="divide-y">
        {sections.map(([term, description]) => (
          <div key={term} className="grid gap-2 p-4 sm:grid-cols-[13rem_1fr]">
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

function CrmFieldTable({ draft }: { draft: CrmPlanDraft }) {
  const fields = draft.fields.filter(({ label }) => label.trim())

  return (
    <div className="border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Sensitivity</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Minimum access</TableHead>
            <TableHead>Retention review</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.length > 0 ? (
            fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell className="min-w-44 align-top font-medium whitespace-normal">
                  {field.label}
                </TableCell>
                <TableCell className="min-w-44 align-top whitespace-normal">
                  {crmFieldCategoryLabel(field.category)}
                </TableCell>
                <TableCell className="min-w-64 align-top whitespace-pre-line">
                  {field.purpose || "Open"}
                </TableCell>
                <TableCell className="min-w-40 align-top whitespace-normal">
                  {crmFieldSensitivityLabel(field.sensitivity)}
                </TableCell>
                <TableCell className="min-w-56 align-top whitespace-pre-line">
                  {field.source || "Open"}
                </TableCell>
                <TableCell className="min-w-52 align-top whitespace-pre-line">
                  {field.accessRole || "Open"}
                </TableCell>
                <TableCell className="min-w-56 align-top whitespace-pre-line">
                  {field.retentionReview || "Open"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center">
                No generic fields named. Add a proposed field above.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function CrmPlanResults({
  draft,
  promptCopied,
  onCopyPrompt,
  onDownload,
}: {
  draft: CrmPlanDraft
  promptCopied: boolean
  onCopyPrompt: () => void
  onDownload: () => void
}) {
  const summary = summarizeCrmPlan(draft)
  const actions = buildCrmActions(draft)
  const prompt = buildCrmReviewPrompt(draft)

  const stats = [
    [
      "Operating areas",
      `${summary.draftedAreaCount}/${summary.totalAreaCount}`,
    ],
    [
      "Lifecycle steps",
      `${summary.lifecycleStepCount}/${summary.totalLifecycleStepCount}`,
    ],
    ["Safeguards", `${summary.safeguardCount}/${summary.totalSafeguardCount}`],
    ["Named fields", String(summary.fieldCount)],
    ["Complete fields", `${summary.completeFieldCount}/${summary.fieldCount}`],
    ["High-risk review", String(summary.highRiskFieldCount)],
  ]

  return (
    <div className="bg-muted/20 border-t p-5 sm:p-6">
      <section aria-labelledby="crm-status-title">
        <h3 id="crm-status-title" className="font-semibold">
          Definition status
        </h3>
        <div className="bg-border mt-4 grid gap-px overflow-hidden border sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(([label, value]) => (
            <div key={label} className="bg-background p-4">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {label}
              </p>
              <p className="mt-3 text-lg font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-3 text-xs leading-5">
          Counts describe this draft. They do not score people or establish
          necessity, consent, permission, accuracy, access, retention, security,
          compliance, vendor fit, relationship quality, or impact.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="crm-lifecycle-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="crm-lifecycle-title" className="font-semibold">
              Live relationship-record lifecycle
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              A step becomes Defined only when every named operating area
              contains text. Human review still applies.
            </p>
          </div>
          <span className="bg-background border px-3 py-1 text-xs font-medium">
            Device-local · Connects to nothing
          </span>
        </div>
        <ol className="bg-border mt-4 grid gap-px overflow-hidden border sm:grid-cols-2 lg:grid-cols-7">
          {CRM_LIFECYCLE.map((step, index) => {
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
                    {complete ? "Defined" : "Open"}
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

      <section className="mt-8" aria-labelledby="crm-brief-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="crm-brief-title" className="font-semibold">
              Working CRM operating brief
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              A planning record, not a privacy policy, retention schedule,
              security plan, legal opinion, or vendor approval.
            </p>
          </div>
          <Button type="button" className="min-h-11" onClick={onDownload}>
            <DownloadIcon data-icon="inline-start" aria-hidden />
            Download plan CSV
          </Button>
        </div>
        <div className="mt-4">
          <CrmOperatingBrief draft={draft} />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="crm-table-title">
        <h3 id="crm-table-title" className="font-semibold">
          Proposed field dictionary
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Generic definitions only. Do not enter or export real constituent
          information from this planner.
        </p>
        <div className="mt-4">
          <CrmFieldTable draft={draft} />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="crm-actions-title">
        <h3 id="crm-actions-title" className="font-semibold">
          Stage and missing-plan actions
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} review prompts generated from this draft. They are
          not findings, approvals, requirements, or vendor advice.
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
        aria-labelledby="crm-ai-title"
      >
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Optional human-reviewed handoff
        </p>
        <h3 id="crm-ai-title" className="mt-2 font-semibold">
          Copy a guarded AI review prompt
        </h3>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          The prompt reviews only generic system and field definitions. Remove
          all real names, contact details, donor, participant, service, health,
          education, employment, payment, credential, and other personal or
          sensitive information before using another service.
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
            <CheckIcon data-icon="inline-start" aria-hidden />
          ) : (
            <CopyIcon data-icon="inline-start" aria-hidden />
          )}
          {promptCopied ? "Prompt copied" : "Copy review prompt"}
        </Button>
      </section>
    </div>
  )
}
