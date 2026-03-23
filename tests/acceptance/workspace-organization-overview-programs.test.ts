import { describe, expect, it } from "vitest"

import {
  resolveOrganizationOverviewDisplayPrograms,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node-static-cards"
import {
  buildWorkspaceProgramEditorHref,
  isWorkspaceProgramRecord,
  isWorkspaceProgramsPreviewOnlyStep,
  resolveWorkspaceProgramsDisplayPrograms,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-programs-card"
import type { OrgProgram } from "@/components/organization/org-profile-card/types"

describe("workspace organization overview programs", () => {
  it("counts structured program rows before falling back to legacy profile text", () => {
    expect(
      resolveOrganizationOverviewDisplayPrograms({
        programsCount: 2,
        legacyProgramsValue: "After School, Summer Camp, Board Training",
      }),
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
    expect(buildWorkspaceProgramEditorHref()).toBe("/workspace?view=editor&tab=programs")
    expect(buildWorkspaceProgramEditorHref("program-123")).toBe(
      "/workspace?view=editor&tab=programs&programId=program-123",
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
})
