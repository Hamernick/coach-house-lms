import { readFileSync } from "node:fs"
import { join } from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import {
  buildWorkspaceBoardUiPreferencesStorageKey,
  normalizeWorkspaceCanvasPersonPlacementsPreference,
  normalizeWorkspaceCanvasViewportPreference,
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
      dataDrawerSnapPoint: 0.48,
      teamAccessCollapsed: true,
      workspacePersonPlacements: [{ personId: "person-a", x: 120, y: 220 }],
    })

    expect(
      storage.get(buildWorkspaceBoardUiPreferencesStorageKey(scope))
    ).toBeTruthy()
    expect(readWorkspaceBoardUiPreferences(scope)).toEqual({
      canvasViewport: { x: 10, y: 20, zoom: 0.75 },
      dataDrawerSnapPoint: 0.48,
      teamAccessCollapsed: true,
      workspacePersonPlacements: [{ personId: "person-a", x: 120, y: 220 }],
    })
  })

  it("wires viewport and drawer state through the shared preference contract", () => {
    const surfaceSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2.tsx"
    )
    const viewportPreferencesSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-viewport-preferences.ts"
    )
    const viewSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-view.tsx"
    )
    const cameraEffectsSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/runtime/workspace-canvas-camera-controller-effects.ts"
    )
    const drawerSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-drawer.tsx"
    )

    expect(surfaceSource).toContain("useWorkspaceCanvasViewportPreferences")
    expect(surfaceSource).toContain("suppressInitialFit")
    expect(surfaceSource).toContain("onMoveEnd: handleWorkspaceMoveEnd")
    expect(surfaceSource).toContain("handleCanvasMoveEnd(event, viewport)")
    expect(surfaceSource).toContain("uiPreferencesScope,")
    expect(viewSource).toContain("uiPreferencesScope={uiPreferencesScope}")
    expect(viewportPreferencesSource).toContain(
      "readWorkspaceBoardUiPreferences"
    )
    expect(viewportPreferencesSource).toContain("flowInstance.setViewport")
    expect(viewportPreferencesSource).toContain(
      "patchWorkspaceBoardUiPreferences"
    )
    expect(viewportPreferencesSource).toContain("canvasViewport,")
    expect(viewportPreferencesSource).toContain("suppressInitialFit:")
    expect(viewSource).toContain("onMoveEnd: OnMoveEnd")
    expect(viewSource).toContain("onMoveEnd={onMoveEnd}")
    expect(cameraEffectsSource).toContain("if (suppressInitialFit) return")
    expect(drawerSource).toContain("dataDrawerSnapPoint: storedSnapPoint")
  })
})
