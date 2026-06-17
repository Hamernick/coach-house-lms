"use client"

import { Separator } from "@/components/ui/separator"
import type { FiscalSponsorshipApplicationDraft } from "../lib/application-draft"
import {
  BooleanField,
  DraftTextareaField,
  EditorSection,
  type DraftFieldChange,
  type EditorSectionChromeProps,
} from "./fiscal-sponsorship-application-editor-controls"
import { FiscalSponsorshipBudgetPlanEditor } from "./fiscal-sponsorship-budget-plan-editor"

export function BudgetBenefitSection({
  applicationReady,
  draft,
  formId,
  onFieldChange,
  projectId,
  sectionChrome,
}: {
  applicationReady: boolean
  draft: FiscalSponsorshipApplicationDraft
  formId: string
  onFieldChange: DraftFieldChange
  projectId: string
  sectionChrome: EditorSectionChromeProps
}) {
  return (
    <EditorSection
      title="Budget, funding, and benefit"
      description="Collect the planning and public-benefit language needed for review."
      {...sectionChrome}
    >
      <FiscalSponsorshipBudgetPlanEditor
        applicationReady={applicationReady}
        draft={draft}
        formId={formId}
        projectId={projectId}
        onFieldChange={onFieldChange}
      />
      <DraftTextareaField
        formId={formId}
        field="prospectiveFundingSources"
        label="Prospective funding sources"
        value={draft.prospectiveFundingSources}
        placeholder="Donors, foundations, sponsors, community fundraising..."
        onFieldChange={onFieldChange}
      />
      <Separator className="border-t border-dashed bg-transparent" />
      <DraftTextareaField
        formId={formId}
        field="publicBenefit"
        label="Public benefit and community impact"
        value={draft.publicBenefit}
        placeholder="Who benefits, and how?"
        onFieldChange={onFieldChange}
      />
      <DraftTextareaField
        formId={formId}
        field="leadershipBackground"
        label="Leadership background"
        value={draft.leadershipBackground}
        placeholder="Experience or relevant background..."
        onFieldChange={onFieldChange}
      />
      <DraftTextareaField
        formId={formId}
        field="initiativeHistory"
        label="Initiative history"
        value={draft.initiativeHistory}
        placeholder="Brief background of this initiative..."
        onFieldChange={onFieldChange}
      />
      <DraftTextareaField
        formId={formId}
        field="shortPublicDescription"
        label="Short public description"
        value={draft.shortPublicDescription}
        placeholder="Public-facing sponsored-project profile copy..."
        onFieldChange={onFieldChange}
      />
    </EditorSection>
  )
}

export function EligibilityAttestationsSection({
  draft,
  formId,
  onFieldChange,
  sectionChrome,
}: {
  draft: FiscalSponsorshipApplicationDraft
  formId: string
  onFieldChange: DraftFieldChange
  sectionChrome: EditorSectionChromeProps
}) {
  const needsConcernExplanation =
    draft.operatesOutsideUnitedStates === "yes" ||
    draft.receivesInvestorReturnFunds === "yes" ||
    draft.engagesInLobbying === "yes" ||
    draft.hasLegalComplianceFinancialConcerns === "yes"

  return (
    <EditorSection
      title="Eligibility attestations"
      description="Capture risk signals early before review and document generation."
      {...sectionChrome}
    >
      <BooleanField
        field="operatesOutsideUnitedStates"
        label="Do you plan to operate outside the United States?"
        value={draft.operatesOutsideUnitedStates}
        onFieldChange={onFieldChange}
      />
      <BooleanField
        field="receivesInvestorReturnFunds"
        label="Do you plan to receive investor-return funds?"
        value={draft.receivesInvestorReturnFunds}
        onFieldChange={onFieldChange}
      />
      <BooleanField
        field="engagesInLobbying"
        label="Do you plan to engage in lobbying activities?"
        value={draft.engagesInLobbying}
        onFieldChange={onFieldChange}
      />
      <BooleanField
        field="hasLegalComplianceFinancialConcerns"
        label="Any legal, compliance, or financial concerns?"
        value={draft.hasLegalComplianceFinancialConcerns}
        onFieldChange={onFieldChange}
      />
      {needsConcernExplanation ? (
        <DraftTextareaField
          formId={formId}
          field="concernsExplanation"
          label="Concern explanation"
          value={draft.concernsExplanation}
          placeholder="Explain any concern marked yes..."
          onFieldChange={onFieldChange}
        />
      ) : null}
    </EditorSection>
  )
}
