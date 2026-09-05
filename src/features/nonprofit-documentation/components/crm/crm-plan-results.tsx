import { DocumentationAiReview } from "../documentation-ai-review"
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
  buildCrmActions,
  buildCrmReviewPrompt,
  crmFieldCategoryLabel,
  crmFieldSensitivityLabel,
  crmRelationshipContextLabel,
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
    <div className="overflow-hidden rounded-xl border">
      <div className="bg-foreground text-background p-4 sm:p-4">
        <p className="text-background/70 text-xs font-semibold tracking-normal">
          {crmRelationshipContextLabel(draft.relationshipContext)}
        </p>
        <h3 className="mt-1 text-base font-semibold text-balance">
          {draft.planName || "Working CRM data-stewardship plan"}
        </h3>
        <p className="text-background/75 mt-1 text-sm">
          {draft.organizationName || "Organization not named"} · Review every{" "}
          <span className="tabular-nums">{draft.reviewMonths} months</span>
        </p>
      </div>
      <dl className="divide-y">
        {sections.map(([term, description]) => (
          <div key={term} className="grid gap-2 p-4 sm:grid-cols-[13rem_1fr]">
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

function CrmFieldTable({ draft }: { draft: CrmPlanDraft }) {
  const fields = draft.fields.filter(({ label }) => label.trim())

  return (
    <div className="overflow-hidden rounded-xl border">
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
              <TableCell colSpan={7} className="py-6 text-center">
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
  const actions = buildCrmActions(draft)
  const prompt = buildCrmReviewPrompt(draft)

  return (
    <div className="bg-muted/20 border-t p-4 sm:p-4">
      <section className="mt-6" aria-labelledby="crm-brief-title">
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

      <section className="mt-6" aria-labelledby="crm-table-title">
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

      <section className="mt-6" aria-labelledby="crm-actions-title">
        <h3 id="crm-actions-title" className="font-semibold">
          Next steps to review
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} review prompts generated from this draft. They are
          not findings, approvals, requirements, or vendor advice.
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
