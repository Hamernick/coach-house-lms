import { Checkbox } from "@/components/ui/checkbox"

import type { HrPlanDraft } from "../../hr-types"
import { HrPlanTextarea } from "./hr-plan-textarea"

export function HrOperationsFields({
  draft,
  updateDraft,
}: {
  draft: HrPlanDraft
  updateDraft: <Key extends keyof HrPlanDraft>(
    key: Key,
    value: HrPlanDraft[Key]
  ) => void
}) {
  return (
    <fieldset className="grid gap-3 border-t p-4 sm:p-4 lg:grid-cols-2">
      <legend className="px-1 text-sm font-semibold">
        Recruitment, support, and transition
      </legend>
      <HrPlanTextarea
        id="hr-recruitment-access"
        label="Recruitment and application access"
        value={draft.recruitmentAccess}
        maxLength={700}
        placeholder="Describe channels, plain-language opportunity details, formats, deadline, application steps, accommodation contact, and information you will not request…"
        onChange={(value) => updateDraft("recruitmentAccess", value)}
      />
      <HrPlanTextarea
        id="hr-selection-process"
        label="Selection process and authority"
        value={draft.selectionProcess}
        maxLength={700}
        placeholder="Define consistent questions, evidence, rubric, reviewers, training, conflicts, accommodations, records, decision authority, and communication…"
        onChange={(value) => updateDraft("selectionProcess", value)}
      />
      <HrPlanTextarea
        id="hr-onboarding-training"
        label="Onboarding and training"
        value={draft.onboardingTraining}
        maxLength={800}
        placeholder="Plan required forms, pay or reimbursement setup, policies, expectations, tools, access, safety, safeguarding, reporting, supervision, and first review…"
        onChange={(value) => updateDraft("onboardingTraining", value)}
        wide
      />
      <HrPlanTextarea
        id="hr-supervision-feedback"
        label="Supervision, workload, and feedback"
        value={draft.supervisionFeedback}
        maxLength={700}
        placeholder="Define check-ins, priorities, evidence, worker input, workload review, learning support, changes, decision records, and urgent escalation…"
        onChange={(value) => updateDraft("supervisionFeedback", value)}
      />
      <HrPlanTextarea
        id="hr-accommodations-access"
        label="Accommodations and ongoing access"
        value={draft.accommodationsAccess}
        maxLength={700}
        placeholder="Name the request path, prompt individualized review, effective communication, accessible place and technology, alternatives, confidentiality, and follow-up…"
        onChange={(value) => updateDraft("accommodationsAccess", value)}
      />
      <HrPlanTextarea
        id="hr-safety-reporting"
        label="Safety, safeguarding, and reporting"
        value={draft.safetyReporting}
        maxLength={700}
        placeholder="Identify foreseeable hazards, controls, training, urgent contacts, protected reporting, non-retaliation, response owners, corrective action, and follow-up…"
        onChange={(value) => updateDraft("safetyReporting", value)}
      />
      <HrPlanTextarea
        id="hr-records-boundary"
        label="People-record boundary"
        value={draft.recordsBoundary}
        maxLength={700}
        placeholder="Define approved systems, separated record types, minimum collection, access, security, correction, retention, disposal, and breach response…"
        onChange={(value) => updateDraft("recordsBoundary", value)}
      />
      <HrPlanTextarea
        id="hr-owner-backup"
        label="Owner, backup, and specialist review"
        value={draft.ownerBackup}
        maxLength={300}
        placeholder="Name the supervisor, operational backup, authorized approver, and qualified review roles…"
        onChange={(value) => updateDraft("ownerBackup", value)}
      />
      <HrPlanTextarea
        id="hr-transition-plan"
        label="Role change and transition plan"
        value={draft.transitionPlan}
        maxLength={700}
        placeholder="Plan authority, fair process, communication, final pay or reimbursement review, benefits and notices, access, equipment, records, continuity, handoff, and learning…"
        onChange={(value) => updateDraft("transitionPlan", value)}
      />
      <div className="grid gap-3 lg:col-span-2">
        {[
          {
            key: "hasClassificationCompensationReview" as const,
            title:
              "Working relationship, compensation, full cost, tax, insurance, and jurisdiction were reviewed",
          },
          {
            key: "hasFairAccessibleProcessReview" as const,
            title:
              "Essential criteria, fair process, conflicts, accommodations, and decision authority were reviewed",
          },
          {
            key: "hasSafetyReportingReview" as const,
            title:
              "Safety, safeguarding, reporting, non-retaliation, response, and follow-up were reviewed",
          },
          {
            key: "hasRecordsAuthorityReview" as const,
            title:
              "People records, access, retention, privacy, approvals, and transition authority were reviewed",
          },
        ].map((item) => (
          <label
            key={item.key}
            className="hover:bg-muted/35 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition-colors md:min-h-9 md:py-2"
          >
            <Checkbox
              checked={draft[item.key]}
              onCheckedChange={(checked) =>
                updateDraft(item.key, checked === true)
              }
            />
            <span className="text-sm leading-5">{item.title}</span>
          </label>
        ))}
      </div>
      <p className="text-muted-foreground text-xs leading-5 lg:col-span-2">
        A checked box records that your team performed a review. It does not
        prove the review was complete, correct, current, authorized, or legally
        sufficient.
      </p>
    </fieldset>
  )
}
