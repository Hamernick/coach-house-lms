import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  getBudgetTotal,
  normalizeFiscalSponsorshipBudgetRows,
  parseBudgetRows,
  readBudgetSourceActivityIdFromMetadata,
  serializeBudgetRows,
} from "@/features/fiscal-sponsorship/lib/budget-plan"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("fiscal sponsorship application UI", () => {
  it("keeps client-callable fiscal actions behind a real Server Action boundary", () => {
    const actionFacade = readSource(
      "src/features/fiscal-sponsorship/actions.ts"
    )
    const applicationDrawer = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-application-drawer.tsx"
    )

    expect(actionFacade.startsWith('"use server"')).toBe(true)
    expect(actionFacade).not.toContain("export {")
    expect(actionFacade).toContain(
      "export async function loadFiscalSponsorshipApplicationDraft"
    )
    expect(actionFacade).toContain(
      "export async function saveFiscalSponsorshipApplicationDraft"
    )
    expect(actionFacade).toContain(
      "export async function submitFiscalSponsorshipApplication"
    )
    expect(applicationDrawer).toContain('from "../actions"')
    expect(applicationDrawer).not.toContain("../server/")
  })

  it("keeps one application editor for inline and drawer surfaces", () => {
    const applicationDrawer = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-application-drawer.tsx"
    )

    expect(applicationDrawer).toContain("FiscalSponsorshipApplicationDrawer")
    expect(applicationDrawer).toContain("FiscalSponsorshipApplicationEditor")
    expect(applicationDrawer).toContain('surface: "drawer" | "inline"')
    expect(applicationDrawer).toContain(
      'data-fiscal-sponsorship-application-editor="inline"'
    )
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
    expect(applicationDrawer).toContain("loadedApplicationKeyRef")
    expect(applicationDrawer).toContain(
      "data.applicationPrefill?.sourceActivityId"
    )
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
    const applicationActions = readSource(
      "src/features/fiscal-sponsorship/server/actions.ts"
    )
    const draftSaveMigration = readSource(
      "supabase/migrations/20260805232500_atomic_fiscal_application_draft_saves.sql"
    )

    expect(budgetPlanEditor).toContain("Budget plan")
    expect(budgetPlanEditor).toContain("BudgetTable")
    expect(budgetPlanEditor).toContain('layout="grid"')
    expect(budgetPlanEditor).toContain("Linked to the budget for")
    expect(budgetPlanEditor).toContain(
      "Saving this application updates the same line items"
    )
    expect(budgetPlanEditor).not.toContain("TableHead")
    expect(budgetPlanEditor).not.toContain('placeholder="$0"')
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
    expect(applicationDraft).toContain("budgetRows: draft.budgetRows")

    expect(applicationActions).toContain("saveFiscalApplicationDraftTransition")
    expect(applicationActions).toContain("budgetRows")
    expect(draftSaveMigration).toContain("'budgetUsd'")
    expect(draftSaveMigration).toContain("'goalUsd'")
    expect(draftSaveMigration).toContain("for update;")
  })

  it("preserves complete program budget rows and ignores zero-only legacy summaries", () => {
    expect(parseBudgetRows("$0.00; $0.00")).toEqual([
      {
        category: "",
        costPerUnit: "",
        costType: "",
        description: "",
        totalCost: "",
        unit: "",
        units: "",
      },
    ])
    expect(
      normalizeFiscalSponsorshipBudgetRows([
        { category: "", description: "", totalCost: "0.00" },
        { category: "", description: "", totalCost: "$0.00" },
      ])
    ).toEqual([])
    expect(
      readBudgetSourceActivityIdFromMetadata({
        selectedActivityId: " program-2 ",
      })
    ).toBe("program-2")

    const rows = parseBudgetRows(
      "Materials | Welding kits | Variable | Participant / Program | 20 | 75.00 | 1500.00"
    )

    expect(rows[0]).toEqual({
      category: "Materials",
      costPerUnit: "75.00",
      costType: "Variable",
      description: "Welding kits",
      totalCost: "1500.00",
      unit: "Participant / Program",
      units: "20",
    })
    expect(getBudgetTotal(rows)).toBe(1500)
    expect(parseBudgetRows(serializeBudgetRows(rows))).toEqual(rows)
  })
})
