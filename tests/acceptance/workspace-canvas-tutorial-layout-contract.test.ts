import { describe, expect, it } from "vitest"

import {
  resolveWorkspaceCanvasTutorialLayoutContract,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-layout-contract"
import { resolveWorkspaceCanvasTutorialBoostedZoom } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-zoom"
import {
  resolveWorkspaceCanvasTutorialStep,
  resolveWorkspaceCanvasTutorialStepCount,
  type WorkspaceCanvasTutorialStepId,
} from "@/features/workspace-canvas-tutorial"

function findTutorialStepIndex(stepId: string) {
  for (let index = 0; index < resolveWorkspaceCanvasTutorialStepCount(); index += 1) {
    if (resolveWorkspaceCanvasTutorialStep(index).id === stepId) {
      return index
    }
  }

  throw new Error(`Unknown tutorial step: ${stepId}`)
}

describe("workspace canvas tutorial layout contract", () => {
  it("keeps centered shells anchored on the shared stage center", () => {
    expect(
      resolveWorkspaceCanvasTutorialLayoutContract({
        tutorialStepIndex: 1,
        breakpoint: "desktop",
        shellWidth: 620,
        shellHeight: 664,
        primaryCardId: null,
        cardPositionOverrides: {},
        guideGap: 0,
        layoutMode: "centered",
      }),
    ).toEqual({
      stageFamily: "overview",
      tutorialNodePosition: { x: 514, y: 78 },
      tutorialNodeStyle: {
        width: 620,
        height: 664,
        minHeight: 664,
      },
      cameraViewport: {
        x: 824,
        y: 410,
        zoom: resolveWorkspaceCanvasTutorialBoostedZoom(0.68),
        duration: 240,
      },
    })
  })

  it("keeps paired accelerator shells attached to the organization rail", () => {
    expect(
      resolveWorkspaceCanvasTutorialLayoutContract({
        tutorialStepIndex: 4,
        openedTutorialStepIds: ["accelerator"],
        breakpoint: "desktop",
        shellWidth: 520,
        shellHeight: 724,
        primaryCardId: "accelerator",
        cardPositionOverrides: {
          "organization-overview": { x: 136, y: 50 },
        },
        guideGap: 64,
        layoutMode: "paired-right-rail",
      }),
    ).toEqual({
      stageFamily: "accelerator",
      tutorialNodePosition: { x: 752, y: 50 },
      tutorialNodeStyle: {
        width: 520,
        height: 724,
        minHeight: 724,
      },
      cameraViewport: {
        x: 1012,
        y: 412,
        zoom: resolveWorkspaceCanvasTutorialBoostedZoom(0.64),
        duration: 240,
      },
    })
  })

  it("keeps accelerator checklist camera framing stable between picker and first-module steps", () => {
    const sharedInput = {
      openedTutorialStepIds: ["accelerator"] as WorkspaceCanvasTutorialStepId[],
      breakpoint: "desktop" as const,
      shellWidth: 520,
      shellHeight: 724,
      primaryCardId: "accelerator" as const,
      cardPositionOverrides: {
        "organization-overview": { x: 136, y: 50 },
      },
      guideGap: 64,
      layoutMode: "paired-right-rail" as const,
    }

    const pickerLayout = resolveWorkspaceCanvasTutorialLayoutContract({
      tutorialStepIndex: findTutorialStepIndex("accelerator-picker"),
      ...sharedInput,
    })
    const firstModuleLayout = resolveWorkspaceCanvasTutorialLayoutContract({
      tutorialStepIndex: findTutorialStepIndex("accelerator-first-module"),
      ...sharedInput,
    })

    expect(firstModuleLayout.tutorialNodePosition).toEqual(
      pickerLayout.tutorialNodePosition,
    )
    expect(firstModuleLayout.cameraViewport).toEqual(
      pickerLayout.cameraViewport,
    )
  })
})
