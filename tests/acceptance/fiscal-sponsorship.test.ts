import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("fiscal-sponsorship prototype", () => {
  it("is available from the prototype lab as the default centered canvas entry", () => {
    const entries = readSource("src/features/prototype-lab/lib/index.ts")
    const sidebarTree = readSource(
      "src/features/prototype-lab/lib/sidebar-tree.ts"
    )
    const panel = readSource(
      "src/features/prototype-lab/components/prototype-lab-panel.tsx"
    )
    const route = readSource(
      "src/app/(admin)/admin/platform/prototypes/page.tsx"
    )

    expect(entries).toContain(
      'const DEFAULT_ENTRY_ID = "fiscal-sponsorship-flow"'
    )
    expect(entries).toContain('id: "fiscal-sponsorship-flow"')
    expect(entries).toContain('projectId: "fiscal-sponsorship"')
    expect(sidebarTree).toContain('label: "Fiscal Sponsorship"')
    expect(sidebarTree).toContain(
      'DEFAULT_PROTOTYPE_LAB_ENTRY_ID = "fiscal-sponsorship-flow"'
    )
    expect(panel).toContain('entryId === "fiscal-sponsorship-flow"')
    expect(panel).toContain("fiscalSponsorshipPrototype")
    expect(route).toContain("FiscalSponsorshipPanel")
  })

  it("models the requested FS plan flow, side drawer, documents, and signature handoff", () => {
    const prototype = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-panel.tsx"
    )
    const drawer = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-step-drawer.tsx"
    )
    const runPanels = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-run-panels.tsx"
    )
    const data = readSource(
      "src/features/fiscal-sponsorship/lib/prototype-data.ts"
    )
    const mark = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-mark.tsx"
    )

    expect(mark).toContain("FS")
    expect(mark).toContain("italic")
    expect(prototype).not.toContain("AnimatePresence")
    expect(prototype).not.toContain("useReducedMotion")
    expect(prototype).toContain(
      "transition-[grid-template-rows,opacity]"
    )
    expect(prototype).toContain("grid-rows-[1fr] opacity-100")
    expect(prototype).toContain(
      "pointer-events-none grid-rows-[0fr] opacity-0"
    )
    expect(prototype).toContain("motion-reduce:transition-none")
    expect(prototype).toContain("Run action")
    expect(prototype).toContain("FiscalSponsorshipRunningPanel")
    expect(prototype).toContain("FiscalSponsorshipCompletionPanel")
    expect(prototype).toContain("from \"@/components/ui/card\"")
    expect(prototype).toContain("bg-muted/70 relative w-full max-w-[42rem]")
    expect(prototype).toContain("CardContent")
    expect(prototype).toContain("CardFooter")
    expect(prototype).not.toContain("CardHeader")
    expect(prototype).toContain("const expanded = active && step.status")
    expect(prototype).toContain("planStatusLabel")
    expect(prototype).not.toContain("decidedCount")
    expect(prototype).not.toContain("of ${steps.length} decided")
    expect(prototype).toContain('planStatusLabel ? "pr-32" : "pr-4"')
    expect(prototype).toContain("px-3 py-2.5")
    expect(prototype).toContain("items-center justify-between")
    expect(prototype).not.toContain("PanelRightOpenIcon")
    expect(prototype).toContain("Review")
    expect(prototype).toContain(
      "ml-auto flex flex-wrap items-center justify-end gap-2"
    )
    expect(prototype).toContain("reviewedStepIds")
    expect(prototype).not.toContain("Review first")
    expect(prototype).toContain(
      '!expanded || !canApprove || step.status === "approved"'
    )
    expect(prototype).not.toContain("Approve all")
    expect(prototype).not.toContain("canApproveAll")
    expect(prototype).toContain("const canRunPlan = steps.every")
    expect(prototype).toContain("disabled={!canRunPlan}")
    expect(prototype).toContain("markStepReviewed(stepId)")
    expect(prototype).toContain("onOpenDetails")
    expect(drawer).toContain("SheetContent")
    expect(drawer).toContain("DocuSeal candidate")
    expect(drawer).toContain("Signature routing placeholder")
    expect(drawer).toContain("Open placeholder PDF")
    expect(drawer).toContain("Open signing PDF")
    expect(drawer).toContain("Use dummy PDFs for now")
    expect(drawer).toContain("Documents")
    expect(drawer).toContain("Sign")
    expect(drawer).toContain("Legal structure")
    expect(drawer).toContain("grid w-full grid-cols-2 rounded-xl")
    expect(drawer).toContain("mx-4 mt-3 grid grid-cols-3 rounded-full")
    expect(drawer).toContain("rounded-2xl border p-3")
    expect(runPanels).toContain("Action running")
    expect(runPanels).toContain("In progress")
    expect(runPanels).toContain("Complete step")
    expect(runPanels).toContain("Plan executed")
    expect(runPanels).toContain("Output saved to")
    expect(runPanels).toContain("View details")
    expect(runPanels).toContain("Files used")
    expect(runPanels).toContain("Actions")
    expect(runPanels).toContain("Outputs")
    expect(runPanels).toContain("DocuSeal signing packet")
    expect(runPanels).toContain("Collapsible")
    expect(runPanels).toContain("animate-in fade-in-0 zoom-in-95")
    expect(data).toContain("FISCAL_SPONSORSHIP_DOCUMENTS")
    expect(data).toContain("FISCAL_SPONSORSHIP_SIGNATURE_PACKET")
    expect(data).toContain("/fiscal-sponsorship/placeholders/how-it-works.pdf")
    expect(data).toContain(
      "/fiscal-sponsorship/placeholders/model-c-agreement.pdf"
    )
    expect(data).toContain("Complete sponsee application")
    expect(data).toContain("Generate & send agreement")
    expect(data).toContain("Submit re-grant request")
  })

  it("includes dummy PDF placeholders for the document and signing flow", () => {
    const pdfPaths = [
      "public/fiscal-sponsorship/placeholders/how-it-works.pdf",
      "public/fiscal-sponsorship/placeholders/sponsee-application.pdf",
      "public/fiscal-sponsorship/placeholders/model-c-agreement.pdf",
      "public/fiscal-sponsorship/placeholders/regrant-request.pdf",
    ]

    for (const pdfPath of pdfPaths) {
      expect(readSource(pdfPath).startsWith("%PDF-1.4")).toBe(true)
    }
  })
})
