import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("fiscal sponsorship prototype flow", () => {
  it("keeps the prototype shell minimal, animated, and review-driven", () => {
    const mark = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-mark.tsx"
    )
    const prototype = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-panel.tsx"
    )
    const runPanels = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-run-panels.tsx"
    )

    expect(mark).toContain("FS")
    expect(mark).toContain("italic")
    expect(prototype).toContain("transition-[grid-template-rows,opacity]")
    expect(prototype).toContain("grid-rows-[1fr] opacity-100")
    expect(prototype).toContain("pointer-events-none grid-rows-[0fr] opacity-0")
    expect(prototype).toContain("motion-reduce:transition-none")
    expect(prototype).toContain("Start workflow")
    expect(prototype).toContain("FiscalSponsorshipRunningPanel")
    expect(prototype).toContain("FiscalSponsorshipCompletionPanel")
    expect(prototype).toContain('surface = "prototype"')
    expect(prototype).toContain('"prototype" | "workspace-card"')
    expect(prototype).toContain("data-fiscal-sponsorship-surface={surface}")
    expect(prototype).toContain("workspace-card-drag-handle")
    expect(prototype).toContain("rounded-[2rem] p-3 shadow-sm")
    expect(prototype).toContain("const expanded = active && step.status")
    expect(prototype).toContain("planStatusLabel")
    expect(prototype).toContain("Review")
    expect(prototype).toContain("getUserFacingStepStateLabel")
    expect(prototype).toContain("markStepReviewed(stepId)")
    expect(prototype).toContain("disabled={!expanded || !canApprove}")
    expect(prototype).toContain("const canRunPlan = steps.every")
    expect(prototype).toContain("disabled={!canRunPlan}")
    expect(prototype).not.toContain("AnimatePresence")
    expect(prototype).not.toContain("useReducedMotion")
    expect(prototype).not.toContain("onSkip")
    expect(prototype).not.toContain(">Skip<")
    expect(prototype).not.toContain("Approve all")

    expect(runPanels).toContain("Action running")
    expect(runPanels).toContain("Workflow complete")
    expect(runPanels).toContain("Output saved to")
    expect(runPanels).toContain("Native signing packet")
    expect(runPanels).toContain("Collapsible")
    expect(runPanels).toContain("animate-in fade-in-0 zoom-in-95")
    expect(runPanels).not.toContain("Compliance review checklist")
    expect(runPanels).not.toContain("skipped. Output saved")
  })

  it("keeps the prototype drawer tied to real application, document, and signing concepts", () => {
    const drawer = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-step-drawer.tsx"
    )
    const applicationFields = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-application-fields.tsx"
    )
    const data = readSource(
      "src/features/fiscal-sponsorship/lib/prototype-data.ts"
    )

    expect(drawer).toContain("SheetContent")
    expect(drawer).toContain("Agreement from Coach House")
    expect(drawer).toContain("Sign agreement")
    expect(drawer).toContain("Submit application")
    expect(drawer).toContain("Open application")
    expect(drawer).toContain("Submit grant request")
    expect(drawer).toContain("Coach House signing packet")
    expect(drawer).toContain("Open viewer")
    expect(drawer).toContain("Download markdown")
    expect(drawer).toContain("document.downloadHref")
    expect(drawer).toContain("Open signing document")
    expect(drawer).toContain("Documents")
    expect(drawer).toContain("Sign")
    expect(drawer).toContain("FiscalSponsorshipApplicationFields")
    expect(drawer).toContain("FiscalSponsorshipHandbookGuide")
    expect(drawer).toContain("programs?: FiscalSponsorshipProgramOption")
    expect(drawer).toContain("mx-4 mt-3 grid grid-cols-3 rounded-full")
    expect(drawer).not.toContain("DocuSeal candidate")
    expect(drawer).not.toContain("This would generate a Model C agreement")
    expect(drawer).not.toContain("Signature routing placeholder")
    expect(drawer).not.toContain("Open sample agreement PDF")
    expect(drawer).not.toContain("Use dummy PDFs for now")
    expect(drawer).not.toContain("@/components/ui/checkbox")

    expect(applicationFields).toContain("Legal structure")
    expect(applicationFields).toContain("Information still needed")
    expect(applicationFields).toContain("Public benefit and community impact")
    expect(applicationFields).toContain("Informal group")
    expect(applicationFields).toContain(
      "FISCAL_SPONSORSHIP_MISSING_APPLICATION_SECTIONS"
    )
    expect(applicationFields).not.toContain(
      "Use program / project / initiative data"
    )
    expect(applicationFields).not.toContain("FISCAL_SPONSORSHIP_PREFILL_ITEMS")

    expect(data).toContain("Complete sponsee application")
    expect(data).toContain("Sign sponsorship agreement")
    expect(data).toContain("Agreement packet")
    expect(data).toContain("Awaiting agreement")
    expect(data).toContain("Submit grant request")
    expect(data).not.toContain("Coach House compliance review")
    expect(data).not.toContain("FISCAL_SPONSORSHIP_REVIEW_CHECKS")
  })
})
