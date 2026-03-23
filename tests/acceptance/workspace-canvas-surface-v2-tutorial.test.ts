import { describe, expect, it } from "vitest"

import {
  resolveWorkspaceCanvasTutorialRuntime,
  resolveWorkspaceCanvasTutorialSceneSignature,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-runtime"
import { resolveWorkspaceCanvasTutorialBoostedZoom } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-zoom"
import {
  resolveWorkspaceCanvasTutorialStep,
  resolveWorkspaceCanvasTutorialStepCount,
  type WorkspaceCanvasTutorialStepId,
} from "@/features/workspace-canvas-tutorial"

const EXISTING_NODES = [
  { id: "organization-overview", x: 120, y: 220, size: "md" },
  { id: "programs", x: 632, y: 220, size: "md" },
  { id: "accelerator", x: 1144, y: 220, size: "sm" },
  { id: "brand-kit", x: 120, y: 692, size: "sm" },
  { id: "economic-engine", x: 1544, y: 220, size: "md" },
  { id: "calendar", x: 1544, y: 500, size: "sm" },
  { id: "communications", x: 1544, y: 988, size: "md" },
  { id: "deck", x: 480, y: 692, size: "md" },
  { id: "roadmap", x: 632, y: 220, size: "sm" },
  { id: "atlas", x: 840, y: 692, size: "md" },
] as const

function resolveRectCenter(position: { x: number; y: number }, size: { width: number; height: number }) {
  return {
    x: position.x + size.width / 2,
    y: position.y + size.height / 2,
  }
}

function resolveTutorialStepIndex(stepId: WorkspaceCanvasTutorialStepId) {
  for (let index = 0; index < resolveWorkspaceCanvasTutorialStepCount(); index += 1) {
    if (resolveWorkspaceCanvasTutorialStep(index).id === stepId) {
      return index
    }
  }

  throw new Error(`Unable to resolve tutorial step index for ${stepId}.`)
}

describe("workspace canvas tutorial runtime", () => {
  it("uses stable scene-family signatures instead of raw step indices", () => {
    const desktopSignature = resolveWorkspaceCanvasTutorialSceneSignature({
      tutorialActive: true,
      tutorialStepIndex: 4,
      openedTutorialStepIds: ["accelerator"],
      breakpoint: "desktop",
    })
    const mobileSignature = resolveWorkspaceCanvasTutorialSceneSignature({
      tutorialActive: true,
      tutorialStepIndex: 4,
      openedTutorialStepIds: ["accelerator"],
      breakpoint: "mobile",
    })
    const organizationSignature = resolveWorkspaceCanvasTutorialSceneSignature({
      tutorialActive: true,
      tutorialStepIndex: 1,
      openedTutorialStepIds: [],
      breakpoint: "desktop",
    })
    const welcomeSignature = resolveWorkspaceCanvasTutorialSceneSignature({
      tutorialActive: true,
      tutorialStepIndex: 0,
      openedTutorialStepIds: [],
      breakpoint: "desktop",
    })
    const acceleratorShortcutClosedSignature =
      resolveWorkspaceCanvasTutorialSceneSignature({
        tutorialActive: true,
        tutorialStepIndex: 3,
        openedTutorialStepIds: [],
        breakpoint: "desktop",
    })

    expect(desktopSignature).toBe("accelerator::desktop")
    expect(mobileSignature).toBe("accelerator::mobile")
    expect(welcomeSignature).toBe("welcome::desktop")
    expect(organizationSignature).toBe("overview::desktop")
    expect(acceleratorShortcutClosedSignature).toBe("overview::desktop")
    expect(
      resolveWorkspaceCanvasTutorialSceneSignature({
        tutorialActive: false,
        tutorialStepIndex: 4,
        openedTutorialStepIds: ["accelerator"],
        breakpoint: "desktop",
      }),
    ).toBeNull()
  })

  it("starts the welcome step on the compact welcome shell", () => {
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: 0,
      visibleCardIds: [],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
    })

    expect(runtime.cardPositionOverrides).toEqual({})
    expect(runtime.tutorialNodePosition).toEqual({ x: 564, y: 248 })
    expect(runtime.tutorialNodeStyle).toEqual({
      width: 520,
      height: 324,
      minHeight: 324,
    })
    expect(runtime.tutorialEdgeTargetCardId).toBeNull()
    expect(runtime.cameraViewport).toEqual({
      x: 824,
      y: 410,
      zoom: resolveWorkspaceCanvasTutorialBoostedZoom(0.68),
      duration: 240,
    })
    expect(runtime.sceneNodeIds).toEqual(["workspace-canvas-tutorial"])
  })

  it("keeps the welcome stage centered even when the organization card is visible", () => {
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: 0,
      visibleCardIds: ["organization-overview"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
    })

    expect(runtime.cardPositionOverrides).toEqual({
      "organization-overview": {
        x: 152,
        y: 248,
      },
    })
    expect(runtime.tutorialNodePosition).toEqual({ x: 564, y: 248 })
    expect(runtime.tutorialNodeStyle).toEqual({
      width: 520,
      height: 324,
      minHeight: 324,
    })
    expect(runtime.cameraViewport).toEqual({
      x: 824,
      y: 410,
      zoom: resolveWorkspaceCanvasTutorialBoostedZoom(0.68),
      duration: 240,
    })
    expect(runtime.sceneNodeIds).toEqual(["workspace-canvas-tutorial"])
  })

  it("keeps the guide center stable between welcome and overview shells", () => {
    const welcomeRuntime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: 0,
      visibleCardIds: ["organization-overview"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
    })
    const overviewRuntime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: 1,
      visibleCardIds: ["organization-overview"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
    })

    expect(
      resolveRectCenter(welcomeRuntime.tutorialNodePosition, welcomeRuntime.tutorialNodeStyle),
    ).toEqual(
      resolveRectCenter(overviewRuntime.tutorialNodePosition, overviewRuntime.tutorialNodeStyle),
    )
  })

  it("uses a stable overview shell for organization guide steps", () => {
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: 1,
      visibleCardIds: ["organization-overview"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
    })

    expect(runtime.tutorialNodeStyle).toEqual({
      width: 620,
      height: 664,
      minHeight: 664,
    })
    expect(runtime.tutorialNodePosition).toEqual({ x: 514, y: 78 })
    expect(runtime.cameraViewport).toEqual({
      x: 824,
      y: 410,
      zoom: resolveWorkspaceCanvasTutorialBoostedZoom(0.68),
      duration: 240,
    })
  })

  it("keeps unresolved overview shortcut steps on the shared overview shell", () => {
    const organizationRuntime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: 1,
      visibleCardIds: ["organization-overview"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
    })
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: 3,
      openedTutorialStepIds: [],
      visibleCardIds: ["organization-overview"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
    })

    expect(runtime.tutorialNodeStyle).toEqual({
      width: 620,
      height: 664,
      minHeight: 664,
    })
    expect(runtime.tutorialNodePosition).toEqual({ x: 514, y: 78 })
    expect(runtime.cameraViewport).toEqual({
      x: 824,
      y: 410,
      zoom: resolveWorkspaceCanvasTutorialBoostedZoom(0.68),
      duration: 240,
    })
    expect(
      resolveRectCenter(runtime.tutorialNodePosition, runtime.tutorialNodeStyle),
    ).toEqual(
      resolveRectCenter(
        organizationRuntime.tutorialNodePosition,
        organizationRuntime.tutorialNodeStyle,
      ),
    )
  })

  it("centers the accelerator family on the guide card on desktop", () => {
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: 4,
      openedTutorialStepIds: ["accelerator"],
      visibleCardIds: ["organization-overview", "accelerator"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
    })

    expect(runtime.cardPositionOverrides["organization-overview"]).toEqual({
      x: 136,
      y: 50,
    })
    expect(runtime.cardPositionOverrides.accelerator).toEqual({
      x: 932,
      y: 208,
    })
    expect(runtime.tutorialNodePosition).toEqual({ x: 752, y: 50 })
    expect(
      runtime.tutorialNodePosition.x -
        (runtime.cardPositionOverrides["organization-overview"]!.x + 552),
    ).toBe(64)
    expect(runtime.tutorialNodePosition.y).toBe(
      runtime.cardPositionOverrides["organization-overview"]!.y,
    )
    expect(runtime.tutorialNodeStyle).toEqual({
      width: 520,
      height: 724,
      minHeight: 724,
    })
    expect(runtime.cameraViewport).toEqual({
      x: 1012,
      y: 412,
      zoom: resolveWorkspaceCanvasTutorialBoostedZoom(0.64),
      duration: 240,
    })
    expect(runtime.sceneNodeIds).toEqual(["workspace-canvas-tutorial"])
  })

  it("adopts the accelerator scene as soon as the shortcut step opens its target", () => {
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: resolveTutorialStepIndex("accelerator"),
      openedTutorialStepIds: ["accelerator"],
      visibleCardIds: ["accelerator"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
    })

    expect(runtime.cardPositionOverrides.accelerator).toEqual({
      x: 932,
      y: 208,
    })
    expect(runtime.tutorialNodePosition).toEqual({ x: 564, y: 48 })
    expect(runtime.tutorialNodeStyle).toEqual({
      width: 520,
      height: 724,
      minHeight: 724,
    })
    expect(runtime.tutorialNodeAttached).toBe(false)
    expect(runtime.cameraViewport).toEqual({
      x: 824,
      y: 410,
      zoom: resolveWorkspaceCanvasTutorialBoostedZoom(0.64),
      duration: 240,
    })
  })

  it("keeps opened calendar shortcut steps on the centered tool shell", () => {
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: resolveTutorialStepIndex("calendar"),
      openedTutorialStepIds: ["accelerator", "calendar"],
      visibleCardIds: ["organization-overview", "accelerator", "calendar"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
    })

    expect(runtime.cardPositionOverrides["organization-overview"]).toEqual({
      x: 132,
      y: 292,
    })
    expect(runtime.cardPositionOverrides.calendar).toEqual({
      x: 968,
      y: 208,
    })
    expect(runtime.cardPositionOverrides.accelerator).toEqual({
      x: 624,
      y: 720,
    })
    expect(runtime.tutorialNodeAttached).toBe(false)
    expect(runtime.tutorialNodePosition).toEqual({ x: 544, y: 72 })
    expect(runtime.cameraViewport).toEqual({
      x: 824,
      y: 410,
      zoom: resolveWorkspaceCanvasTutorialBoostedZoom(0.62),
      duration: 240,
    })
  })

  it("recenters the guide on the overview shell before the Calendar shortcut is opened", () => {
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: resolveTutorialStepIndex("calendar"),
      openedTutorialStepIds: ["accelerator", "accelerator-first-module"],
      visibleCardIds: ["organization-overview", "accelerator"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
    })

    expect(runtime.cardPositionOverrides["organization-overview"]).toEqual({
      x: 152,
      y: 248,
    })
    expect(runtime.cardPositionOverrides.accelerator).toEqual({
      x: 912,
      y: 184,
    })
    expect(runtime.tutorialNodePosition).toEqual({ x: 514, y: 78 })
    expect(runtime.tutorialNodeAttached).toBe(false)
    expect(runtime.cameraViewport).toEqual({
      x: 824,
      y: 410,
      zoom: resolveWorkspaceCanvasTutorialBoostedZoom(0.68),
      duration: 240,
    })
  })

  it("keeps mobile accelerator steps on the same centered family shell", () => {
    const acceleratorPickerStepIndex = resolveTutorialStepIndex("accelerator-picker")
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: acceleratorPickerStepIndex,
      openedTutorialStepIds: ["accelerator"],
      visibleCardIds: ["organization-overview", "accelerator"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "mobile",
    })

    expect(runtime.cardPositionOverrides["organization-overview"]).toEqual({
      x: 48,
      y: 64,
    })
    expect(runtime.cardPositionOverrides.accelerator).toEqual({
      x: 88,
      y: 324,
    })
    expect(runtime.tutorialNodePosition).toEqual({ x: 240, y: 48 })
    expect(runtime.tutorialNodeStyle).toEqual({
      width: 520,
      height: 724,
      minHeight: 724,
    })
    expect(runtime.cameraViewport).toEqual({
      x: 500,
      y: 410,
      zoom: resolveWorkspaceCanvasTutorialBoostedZoom(0.52),
      duration: 240,
    })
  })

  it("keeps accelerator module steps centered on the guide card", () => {
    const closeModuleStepIndex = resolveTutorialStepIndex("accelerator-close-module")
    const runtime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: closeModuleStepIndex,
      openedTutorialStepIds: ["accelerator", "accelerator-first-module"],
      visibleCardIds: ["organization-overview", "accelerator"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
      acceleratorModuleViewerOpen: true,
    })

    expect(runtime.cardPositionOverrides["organization-overview"]).toEqual({
      x: 136,
      y: 50,
    })
    expect(runtime.cardPositionOverrides.accelerator).toEqual({
      x: 728,
      y: 232,
    })
    expect(runtime.tutorialNodePosition).toEqual({ x: 752, y: 50 })
    expect(runtime.tutorialNodeStyle).toEqual({
      width: 560,
      height: 960,
      minHeight: 960,
    })
    expect(runtime.cameraViewport).toEqual({
      x: 1032,
      y: 530,
      zoom: resolveWorkspaceCanvasTutorialBoostedZoom(0.64),
      duration: 240,
    })
    expect(runtime.sceneNodeIds).toEqual(["workspace-canvas-tutorial"])
  })

  it("keeps accelerator checklist steps on the compact shell and only grows on module open", () => {
    const acceleratorStepIndex = resolveTutorialStepIndex("accelerator")
    const pickerStepIndex = resolveTutorialStepIndex("accelerator-picker")
    const firstModuleStepIndex = resolveTutorialStepIndex("accelerator-first-module")
    const closeModuleStepIndex = resolveTutorialStepIndex("accelerator-close-module")
    const acceleratorRuntime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: acceleratorStepIndex,
      openedTutorialStepIds: ["accelerator"],
      visibleCardIds: ["accelerator"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
    })
    const pickerRuntime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: pickerStepIndex,
      openedTutorialStepIds: ["accelerator"],
      visibleCardIds: ["organization-overview", "accelerator"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
    })
    const firstModuleRuntime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: firstModuleStepIndex,
      openedTutorialStepIds: ["accelerator"],
      visibleCardIds: ["organization-overview", "accelerator"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
    })
    const moduleRuntime = resolveWorkspaceCanvasTutorialRuntime({
      tutorialStepIndex: closeModuleStepIndex,
      openedTutorialStepIds: ["accelerator", "accelerator-first-module"],
      visibleCardIds: ["organization-overview", "accelerator"],
      existingNodes: [...EXISTING_NODES],
      breakpoint: "desktop",
      acceleratorModuleViewerOpen: true,
    })

    expect(acceleratorRuntime.tutorialNodeStyle).toEqual({
      width: 520,
      height: 724,
      minHeight: 724,
    })
    expect(pickerRuntime.tutorialNodeStyle).toEqual({
      width: 520,
      height: 724,
      minHeight: 724,
    })
    expect(firstModuleRuntime.tutorialNodeStyle).toEqual({
      width: 520,
      height: 724,
      minHeight: 724,
    })
    expect(moduleRuntime.tutorialNodeStyle).toEqual({
      width: 560,
      height: 960,
      minHeight: 960,
    })
    expect(acceleratorRuntime.tutorialNodePosition).toEqual({ x: 564, y: 48 })
    expect(pickerRuntime.tutorialNodePosition).toEqual({ x: 752, y: 50 })
    expect(firstModuleRuntime.tutorialNodePosition).toEqual({ x: 752, y: 50 })
    expect(moduleRuntime.tutorialNodePosition).toEqual({ x: 752, y: 50 })
    expect(acceleratorRuntime.cameraViewport).toEqual({
      x: 824,
      y: 410,
      zoom: resolveWorkspaceCanvasTutorialBoostedZoom(0.64),
      duration: 240,
    })
    expect(pickerRuntime.cameraViewport).toEqual({
      x: 1012,
      y: 412,
      zoom: resolveWorkspaceCanvasTutorialBoostedZoom(0.64),
      duration: 240,
    })
    expect(firstModuleRuntime.cameraViewport).toEqual(pickerRuntime.cameraViewport)
  })
})
