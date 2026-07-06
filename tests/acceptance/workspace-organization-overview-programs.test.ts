import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { resolveOrganizationOverviewDisplayPrograms } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node-static-cards"
import {
  buildWorkspaceProgramEditorHref,
  isWorkspaceProgramRecord,
  isWorkspaceProgramsPreviewOnlyStep,
  resolveWorkspaceProgramsDisplayPrograms,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-programs-card"
import type { OrgProgram } from "@/components/organization/org-profile-card/types"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("workspace organization overview programs", () => {
  it("counts structured program rows before falling back to legacy profile text", () => {
    expect(
      resolveOrganizationOverviewDisplayPrograms({
        programsCount: 2,
        legacyProgramsValue: "After School, Summer Camp, Board Training",
      })
    ).toBe(2)
  })

  it("sorts structured workspace programs newest-first for the standalone programs card", () => {
    const visible = resolveWorkspaceProgramsDisplayPrograms({
      programs: [
        {
          id: "older",
          title: "Older program",
          created_at: "2026-01-15T00:00:00.000Z",
        },
        {
          id: "newer",
          title: "Newer program",
          created_at: "2026-02-20T00:00:00.000Z",
        },
      ] satisfies OrgProgram[],
      legacyProgramsValue: null,
    })

    expect(visible.map((program) => program.id)).toEqual(["newer", "older"])
  })

  it("falls back to legacy profile program titles when structured rows do not exist yet", () => {
    const visible = resolveWorkspaceProgramsDisplayPrograms({
      programs: [],
      legacyProgramsValue: "After School, Summer Camp, Board Training",
    })

    expect(visible.map((program) => program.title)).toEqual([
      "After School",
      "Summer Camp",
      "Board Training",
    ])
  })

  it("creates legacy placeholder rows when only freeform program text exists", () => {
    const visible = resolveWorkspaceProgramsDisplayPrograms({
      programs: [],
      legacyProgramsValue: "After School, Summer Camp",
    })

    expect(visible).toEqual([
      {
        id: "legacy-program-0",
        title: "After School",
        status_label: "Configured",
      },
      {
        id: "legacy-program-1",
        title: "Summer Camp",
        status_label: "Configured",
      },
    ])
  })

  it("builds workspace editor hrefs for the programs tab and a specific program", () => {
    expect(buildWorkspaceProgramEditorHref()).toBe(
      "/workspace?view=editor&tab=programs"
    )
    expect(buildWorkspaceProgramEditorHref("program-123")).toBe(
      "/workspace?view=editor&tab=programs&programId=program-123"
    )
  })

  it("only treats persisted program rows as editable overlay records", () => {
    expect(isWorkspaceProgramRecord({ id: "program-123" })).toBe(true)
    expect(isWorkspaceProgramRecord({ id: "legacy-program-0" })).toBe(false)
  })

  it("treats the programs tutorial step as preview-only", () => {
    expect(isWorkspaceProgramsPreviewOnlyStep("programs")).toBe(true)
    expect(isWorkspaceProgramsPreviewOnlyStep("calendar")).toBe(false)
    expect(isWorkspaceProgramsPreviewOnlyStep(null)).toBe(false)
  })

  it("uses Activity copy and keeps owner activity cards editable", () => {
    const workspaceProgramsCard = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-programs-card.tsx"
    )
    const workspaceProgramsRenderer = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node-card-programs-renderer.tsx"
    )
    const workspaceNodeCard = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node-card.tsx"
    )
    const shellSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node-card-shell.tsx"
    )
    const dashboardCard = readSource(
      "src/components/organization/program-builder-dashboard-card.tsx"
    )
    const myOrganizationPage = readSource(
      "src/app/(dashboard)/my-organization/_lib/my-organization-page-content.tsx"
    )
    const programActions = readSource("src/actions/programs.ts")
    const programMediaRoute = readSource(
      "src/app/api/account/program-media/route.ts"
    )

    expect(workspaceProgramsCard).toContain('title="No activity to display"')
    expect(workspaceProgramsCard).toContain('"Untitled activity"')
    expect(workspaceProgramsCard).toContain("Open activity")
    expect(workspaceProgramsCard).toContain(
      'className="bg-background min-h-[148px] rounded-xl px-4 py-6 shadow-none"'
    )
    expect(workspaceProgramsCard).not.toContain('<div className="pb-3">')
    expect(workspaceProgramsCard).not.toContain(
      "bg-background mb-3 min-h-[148px]"
    )
    expect(workspaceProgramsCard).toContain(
      'className="flex min-h-0 flex-col gap-3 pb-0"'
    )
    expect(workspaceProgramsCard).not.toContain(
      'className="flex min-h-0 flex-col gap-3 pb-0.5"'
    )
    expect(workspaceProgramsCard).toContain("setApi={onCarouselApiChange}")
    expect(workspaceProgramsCard).toContain(
      "useWorkspaceCanvasOverlayDrawerContainer"
    )
    expect(workspaceProgramsCard).toContain(
      "const canvasPortalContainer = useWorkspaceCanvasOverlayDrawerContainer()"
    )
    expect(workspaceProgramsCard).toContain(
      "portalContainer={canvasPortalContainer}"
    )
    expect(workspaceProgramsCard).toContain(
      'opts={{ align: "start", loop: false }}'
    )
    expect(workspaceProgramsCard).not.toContain(
      "loop: sortedPrograms.length > 1"
    )
    expect(workspaceProgramsCard).toContain(
      "onCarouselApiChange?: (api: CarouselApi) => void"
    )
    expect(workspaceProgramsCard).toContain(
      '<CarouselContent className="ml-0 items-stretch">'
    )
    expect(workspaceProgramsCard).toContain('className="flex pl-0"')
    expect(workspaceProgramsCard).not.toContain(
      "mb-2 flex items-center justify-end gap-1.5 px-1"
    )
    expect(workspaceProgramsCard).not.toContain("Create object")
    expect(workspaceProgramsCard).toContain(
      'className="h-8 rounded-lg px-3 text-xs shadow-none"'
    )
    expect(workspaceProgramsRenderer).toContain(
      'aria-label="Previous activity"'
    )
    expect(workspaceProgramsRenderer).toContain('aria-label="Next activity"')
    expect(workspaceProgramsRenderer).toContain("carouselApi?.scrollPrev()")
    expect(workspaceProgramsRenderer).toContain("carouselApi?.scrollNext()")
    expect(workspaceProgramsRenderer).toContain(
      "onCarouselApiChange={setCarouselApi}"
    )
    expect(workspaceProgramsRenderer).toContain(
      "headerAction={renderProgramsHeaderAction({"
    )
    expect(workspaceProgramsRenderer).toContain(
      "footer={renderProgramsFooterAction({"
    )
    expect(workspaceProgramsRenderer).toContain(
      'shellInsetClassName="px-3 pt-3 pb-3"'
    )
    expect(workspaceProgramsRenderer).not.toContain(
      'shellInsetClassName="px-3 pt-3 pb-0"'
    )
    expect(workspaceProgramsRenderer).toContain(
      'footerClassName="justify-center px-3 pt-2 pb-3"'
    )
    expect(workspaceProgramsRenderer).toContain(
      'className="h-8 rounded-md px-3"'
    )
    expect(workspaceProgramsRenderer).not.toContain('className="ml-auto"')
    expect(workspaceProgramsRenderer).toContain(
      "onProgramsCreateOpenChange(true)"
    )
    expect(shellSource).toContain("gap-3 px-3 py-3")
    expect(shellSource).not.toContain("gap-3 px-4 pt-4 pb-1")
    expect(workspaceProgramsCard).not.toContain("<CarouselPrevious")
    expect(workspaceProgramsCard).not.toContain("<CarouselNext")
    expect(workspaceProgramsCard).not.toContain(
      "pointer-events-auto absolute -top-10 right-1 flex items-center gap-1.5"
    )
    expect(workspaceProgramsCard).toContain(
      "@/components/programs/program-card"
    )
    expect(workspaceProgramsCard).toContain("<ProgramCard")
    expect(workspaceProgramsCard).toContain(
      "h-full min-h-0 max-w-none border shadow-none"
    )
    expect(workspaceProgramsCard).not.toContain("contentFill={false}")
    expect(workspaceProgramsCard).not.toContain("group/activity-preview")
    expect(workspaceProgramsCard).not.toContain("formatWorkspaceActivityMoney")
    expect(workspaceProgramsCard).not.toContain("top-3 right-3")
    expect(workspaceProgramsCard).not.toContain("right-[3.25rem]")
    expect(workspaceNodeCard).toContain(
      'cardId === "organization-overview" ||\n    cardId === "programs" ||'
    )
    expect(dashboardCard).toContain('title="No activity to display"')
    expect(dashboardCard).toContain("Add activity")
    expect(dashboardCard).toContain("Start activity builder")
    expect(dashboardCard).toContain("Supported activity types")
    expect(dashboardCard).toContain("Untitled activity")
    expect(dashboardCard).toContain("Open full view")
    expect(dashboardCard).not.toContain("ArrowUpRightIcon")
    expect(myOrganizationPage).toContain(
      "const canEdit = isAdmin || canEditOrganization(role)"
    )
    expect(programActions).toContain("resolveProfileAudience")
    expect(programActions).toContain(
      "const canEdit = profileAudience.isAdmin || canEditOrganization(role)"
    )
    expect(programMediaRoute).toContain("resolveProfileAudience")
    expect(programMediaRoute).toContain(
      "if (!profileAudience.isAdmin && !canEditOrganization(role))"
    )
    expect(workspaceProgramsCard).not.toContain(
      'title="No primary objects to display"'
    )
    expect(dashboardCard).not.toContain('title="No primary objects to display"')
    expect(dashboardCard).not.toContain("New object")
    expect(dashboardCard).not.toContain("Start object builder")
    expect(dashboardCard).not.toContain("Supported primary object types")
  })
})
