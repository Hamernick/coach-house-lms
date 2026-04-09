import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ExecutionAcceleratorPane } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node-tool-card-execution-content"
import type { WorkspaceAcceleratorChecklistModule } from "@/features/workspace-accelerator-card/lib/checklist"

describe("workspace board execution content", () => {
  it("renders accelerator rows as a single fullscreen-trigger button per step", () => {
    const checklistModules: WorkspaceAcceleratorChecklistModule[] = [
      {
        id: "m-1",
        title: "Naming your NFP",
        groupTitle: "Formation",
        totalSteps: 1,
        completedStepCount: 0,
        isCurrent: true,
        steps: [
          {
            id: "m-1:lesson",
            moduleId: "m-1",
            moduleTitle: "Naming your NFP",
            stepKind: "lesson",
            stepTitle: "Lesson",
            stepDescription: "Write your mission statement draft",
            href: "/accelerator/class/formation/module/1",
            status: "in_progress",
            stepSequenceIndex: 1,
            stepSequenceTotal: 1,
            moduleSequenceIndex: 1,
            moduleSequenceTotal: 1,
            groupTitle: "Formation",
            videoUrl: null,
            durationMinutes: null,
            resources: [],
            hasAssignment: false,
            hasDeck: false,
          },
        ],
      },
    ]

    const markup = renderToStaticMarkup(
      React.createElement(ExecutionAcceleratorPane, {
        selectedLessonGroupLabel: "Formation",
        doneCount: 0,
        totalCount: 1,
        progressPercent: 0,
        checklistModules,
        currentStepId: "m-1:lesson",
        completedStepIds: new Set<string>(),
        onOpenStep: () => {},
      }),
    )

    expect(markup).toContain('aria-label="Open Naming your NFP in Accelerator"')
    expect(markup).toContain("Write your mission statement draft")
    expect(markup.match(/<button/g)).toHaveLength(1)
  })
})
