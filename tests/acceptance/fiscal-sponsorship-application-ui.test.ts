import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("fiscal sponsorship application UI", () => {
  it("keeps the drawer persistent, scroll-safe, and submission-owned", () => {
    const applicationDrawer = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-application-drawer.tsx"
    )

    expect(applicationDrawer).toContain("FiscalSponsorshipApplicationDrawer")
    expect(applicationDrawer).toContain("SheetContent")
    expect(applicationDrawer).toContain("loadFiscalSponsorshipApplicationDraft")
    expect(applicationDrawer).toContain("saveFiscalSponsorshipApplicationDraft")
    expect(applicationDrawer).toContain("submitFiscalSponsorshipApplication")
    expect(applicationDrawer).toContain(
      "buildFiscalSponsorshipApplicationInput"
    )
    expect(applicationDrawer).toContain("Save draft")
    expect(applicationDrawer).toContain("Submit for review")
    expect(applicationDrawer).toContain("Submitting…")
    expect(applicationDrawer).toContain('status: "draft"')
    expect(applicationDrawer).toContain("data.workflowSummary?.applicationId")
    expect(applicationDrawer).toContain("projectId={data.projectId}")
    expect(applicationDrawer).toContain("draftDirty")
    expect(applicationDrawer).toContain("onEscapeKeyDown")
    expect(applicationDrawer).toContain("onInteractOutside")
    expect(applicationDrawer).toContain("Discard application changes?")
    expect(applicationDrawer).toContain("beforeunload")
    expect(applicationDrawer).toContain("<ScrollFadeEffect")
    expect(applicationDrawer).toContain(
      "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 [--mask-height:2rem] [--scroll-buffer:1.5rem]"
    )
    expect(applicationDrawer).not.toContain(
      '<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">'
    )
  })

  it("keeps application sections dynamic and stackable", () => {
    const applicationEditorFields = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-application-editor-fields.tsx"
    )
    const applicationEditorControls = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-application-editor-controls.tsx"
    )
    const applicationPrimarySections = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-application-editor-primary-sections.tsx"
    )
    const applicationProjectTimelineFields = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-project-timeline-fields.tsx"
    )
    const applicationReviewSections = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-application-editor-review-sections.tsx"
    )

    expect(applicationEditorFields).toContain("ApplicantContactSection")
    expect(applicationEditorFields).toContain("LegalTaxSection")
    expect(applicationEditorFields).toContain("ProjectScopeSection")
    expect(applicationEditorFields).toContain("BudgetBenefitSection")
    expect(applicationEditorFields).toContain("EligibilityAttestationsSection")
    expect(applicationEditorFields).toContain("APPLICATION_SECTION_IDS")
    expect(applicationEditorFields).toContain("firstIncompleteSectionId")
    expect(applicationEditorFields).toContain("getSectionChrome")
    expect(applicationEditorFields).toContain(
      'draft.legalEntityType === "individual" || hasText(draft.formationStatus)'
    )

    expect(applicationEditorControls).toContain("Badge")
    expect(applicationEditorControls).toContain(
      "FISCAL_APPLICATION_SECTION_ROW_CLASSNAME"
    )
    expect(applicationEditorControls).toContain("transition-[background-color]")
    expect(applicationEditorControls).toContain("aria-expanded={open}")
    expect(applicationEditorControls).toContain("grid-rows-[1fr] opacity-100")
    expect(applicationEditorControls).toContain("Complete")
    expect(applicationEditorControls).toContain("Needed")
    expect(applicationEditorControls).toContain(
      "h-7 max-w-full overflow-visible rounded-full"
    )
    expect(applicationEditorControls).not.toContain("group-hover:shadow-sm")

    expect(applicationPrimarySections).toContain("Applicant and contact")
    expect(applicationPrimarySections).toContain("Legal entity and tax")
    expect(applicationPrimarySections).toContain("Project scope")
    expect(applicationPrimarySections).toContain('field="applicantFirstName"')
    expect(applicationPrimarySections).toContain('field="applicantLastName"')
    expect(applicationPrimarySections).toContain("FormationStatusCardPicker")
    expect(applicationPrimarySections).toContain("ToggleGroupPrimitive.Root")
    expect(applicationPrimarySections).toContain(
      "OrganizationFormationStatusSummary"
    )
    expect(applicationPrimarySections).toContain(
      'nextLegalEntityType === "individual"'
    )
    expect(applicationPrimarySections).not.toContain(
      'field="applicantFullName"'
    )
    expect(applicationPrimarySections).not.toContain("Application status")

    expect(applicationProjectTimelineFields).toContain("ProjectTimelineFields")
    expect(applicationProjectTimelineFields).toContain(
      'nextDuration === "ongoing_multi_year"'
    )
    expect(applicationProjectTimelineFields).toContain(
      'onFieldChange("temporaryEndDate", "")'
    )
    expect(applicationProjectTimelineFields).toContain(
      "No proposed end date yet"
    )
    expect(applicationProjectTimelineFields).toContain("No end date required")

    expect(applicationReviewSections).toContain("needsConcernExplanation")
    expect(applicationReviewSections).toContain(
      'draft.operatesOutsideUnitedStates === "yes"'
    )
    expect(applicationReviewSections).toContain("Budget, funding, and benefit")
    expect(applicationReviewSections).toContain(
      "FiscalSponsorshipBudgetPlanEditor"
    )
    expect(applicationReviewSections).not.toContain('field="expenseSummary"')
  })

  it("keeps budget support imports and draft prefill wired to saved data", () => {
    const budgetPlanEditor = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-budget-plan-editor.tsx"
    )
    const budgetPlanHelpers = readSource(
      "src/features/fiscal-sponsorship/lib/budget-plan.ts"
    )
    const applicationDraft = readSource(
      "src/features/fiscal-sponsorship/lib/application-draft.ts"
    )

    expect(budgetPlanEditor).toContain("Budget plan")
    expect(budgetPlanEditor).toContain("TableHeader")
    expect(budgetPlanEditor).toContain("Import CSV rows")
    expect(budgetPlanEditor).toContain("parseCsvBudgetRows")
    expect(budgetPlanEditor).toContain("connectFiscalSponsorshipDocumentAsset")
    expect(budgetPlanEditor).toContain('documentKey: "budget_support"')
    expect(budgetPlanEditor).toContain("estimatedBudgetDollars")
    expect(budgetPlanEditor).toContain("expenseSummary")
    expect(budgetPlanEditor).toContain("Budget support files")

    expect(budgetPlanHelpers).toContain('fetch("/api/account/project-assets"')
    expect(budgetPlanHelpers).toContain("parseCsvBudgetRows")

    expect(applicationDraft).toContain("buildFiscalSponsorshipApplicationDraft")
    expect(applicationDraft).toContain("buildFiscalSponsorshipApplicationInput")
    expect(applicationDraft).toContain(
      'source: "member-workspace-project-fiscal-workbench"'
    )
    expect(applicationDraft).toContain("documentTemplatePayload")
    expect(applicationDraft).toContain("individualApplicant")
    expect(applicationDraft).toContain('draft.legalEntityType === "individual"')
  })
})
