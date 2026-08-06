import { readFileSync } from "node:fs"
import { join } from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import {
  buildWorkspaceBoardUiPreferencesStorageKey,
  normalizeWorkspaceCanvasPersonPlacementsPreference,
  normalizeWorkspaceCanvasViewportPreference,
  normalizeWorkspaceDataDrawerSnapPointPreference,
  normalizeWorkspaceDataDrawerTabPreference,
  patchWorkspaceBoardUiPreferences,
  readWorkspaceBoardUiPreferences,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-ui-preferences"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

function stubLocalStorage() {
  const storage = new Map<string, string>()
  vi.stubGlobal("window", {
    localStorage: {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value)
      }),
    },
  })
  return storage
}

describe("workspace board UI preferences", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("scopes persisted UI state to the active organization and viewer", () => {
    expect(
      buildWorkspaceBoardUiPreferencesStorageKey({
        orgId: "org 1",
        viewerId: "user@example.com",
      })
    ).toBe("coachhouse:workspace-board-ui:v1:org%201:user%40example.com")
  })

  it("normalizes the saved React Flow viewport before storage", () => {
    expect(
      normalizeWorkspaceCanvasViewportPreference({
        x: 12.345,
        y: -98.765,
        zoom: 4,
      })
    ).toEqual({
      x: 12.35,
      y: -98.76,
      zoom: 1.25,
    })
    expect(normalizeWorkspaceCanvasViewportPreference({ x: 1 })).toBeNull()
  })

  it("normalizes saved workspace person placements before storage", () => {
    expect(
      normalizeWorkspaceCanvasPersonPlacementsPreference([
        { personId: " person-a ", x: 12.4, y: -8.6 },
        { personId: "", x: 1, y: 2 },
        { personId: "person-b", x: 999999, y: -999999 },
        { personId: "person-a", x: 22.8, y: 33.2 },
      ])
    ).toEqual([
      { personId: "person-b", x: 50000, y: -50000 },
      { personId: "person-a", x: 23, y: 33 },
    ])

    expect(normalizeWorkspaceCanvasPersonPlacementsPreference({})).toEqual([])
  })

  it("patches local UI preferences without requiring board-layout persistence", () => {
    const storage = stubLocalStorage()
    const scope = {
      orgId: "org-1",
      viewerId: "user-1",
    }

    patchWorkspaceBoardUiPreferences(scope, {
      canvasViewport: { x: 10, y: 20, zoom: 0.75 },
      canvasViewportLayoutVersion: 2,
      dataDrawerSnapPoint: 0.48,
      dataDrawerTab: "documents",
      teamAccessCollapsed: true,
      workspacePersonPlacements: [{ personId: "person-a", x: 120, y: 220 }],
    })

    expect(
      storage.get(buildWorkspaceBoardUiPreferencesStorageKey(scope))
    ).toBeTruthy()
    expect(readWorkspaceBoardUiPreferences(scope)).toEqual({
      canvasViewport: { x: 10, y: 20, zoom: 0.75 },
      canvasViewportLayoutVersion: 2,
      dataDrawerSnapPoint: 0.48,
      dataDrawerTab: "documents",
      teamAccessCollapsed: true,
      workspacePersonPlacements: [{ personId: "person-a", x: 120, y: 220 }],
    })
  })

  it("defaults invalid drawer tabs to Accelerator", () => {
    expect(normalizeWorkspaceDataDrawerTabPreference("organization")).toBe(
      "organization"
    )
    expect(normalizeWorkspaceDataDrawerTabPreference("accelerator")).toBe(
      "accelerator"
    )
    expect(normalizeWorkspaceDataDrawerTabPreference("people")).toBe("people")
    expect(normalizeWorkspaceDataDrawerTabPreference("roadmap")).toBe("roadmap")
    expect(normalizeWorkspaceDataDrawerTabPreference("documents")).toBe(
      "documents"
    )
    expect(normalizeWorkspaceDataDrawerTabPreference("unknown")).toBe(
      "accelerator"
    )
  })

  it("keeps the collapsed drawer tall enough for its tab row", () => {
    expect(normalizeWorkspaceDataDrawerSnapPointPreference(0.06)).toBe("68px")
    expect(normalizeWorkspaceDataDrawerSnapPointPreference("44px")).toBe("68px")
    expect(normalizeWorkspaceDataDrawerSnapPointPreference("52px")).toBe("68px")
    expect(normalizeWorkspaceDataDrawerSnapPointPreference("68px")).toBe("68px")
    expect(normalizeWorkspaceDataDrawerSnapPointPreference(0.48)).toBe(0.48)
  })

  it("wires viewport and drawer state through the shared preference contract", () => {
    const surfaceSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2.tsx"
    )
    const bootstrapSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/use-workspace-canvas-surface-v2-bootstrap.ts"
    )
    const viewportPreferencesSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-viewport-preferences.ts"
    )
    const viewSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-view.tsx"
    )
    const viewTypesSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-view-types.ts"
    )
    const cameraEffectsSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/runtime/workspace-canvas-camera-controller-effects.ts"
    )
    const drawerSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-drawer.tsx"
    )

    expect(bootstrapSource).toContain("useWorkspaceCanvasViewportPreferences")
    expect(surfaceSource).toContain(
      "suppressInitialFit: viewport.suppressInitialFit"
    )
    expect(surfaceSource).toContain("onMoveEnd: viewport.handleCanvasMoveEnd")
    expect(viewportPreferencesSource).toContain(
      "setViewportZoom(viewport.zoom)"
    )
    expect(viewportPreferencesSource).toContain("viewportZoom,")
    expect(surfaceSource).toContain(
      "uiPreferencesScope: viewport.uiPreferencesScope"
    )
    expect(viewSource).toContain("uiPreferencesScope={uiPreferencesScope}")
    expect(viewportPreferencesSource).toContain(
      "readWorkspaceBoardUiPreferences"
    )
    expect(viewportPreferencesSource).toContain("flowInstance.setViewport")
    expect(viewportPreferencesSource).toContain(
      "patchWorkspaceBoardUiPreferences"
    )
    expect(viewportPreferencesSource).toContain("canvasViewport,")
    expect(viewportPreferencesSource).toContain(
      "WORKSPACE_CANVAS_VIEWPORT_LAYOUT_VERSION"
    )
    expect(viewportPreferencesSource).toContain("canvasViewport: null")
    expect(viewportPreferencesSource).toContain("suppressInitialFit:")
    expect(viewTypesSource).toContain("onMoveEnd: OnMoveEnd")
    expect(viewSource).toContain("onMoveEnd={onMoveEnd}")
    expect(cameraEffectsSource).toContain("if (suppressInitialFit) return")
    expect(drawerSource).toContain("dataDrawerSnapPoint: storedSnapPoint")
    expect(drawerSource).toContain("dataDrawerTab: nextTab")
    expect(drawerSource).toContain(
      "readWorkspaceBoardUiPreferences(uiPreferencesScope)\n      if (request) return"
    )
    expect(drawerSource).toContain("}, [request, uiPreferencesScope])")
  })
})
