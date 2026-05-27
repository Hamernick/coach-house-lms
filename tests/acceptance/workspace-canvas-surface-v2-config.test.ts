import { readFileSync } from "node:fs"
import { join } from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

const ROOT = process.cwd()

const { logWorkspaceCanvasErrorMock } = vi.hoisted(() => ({
  logWorkspaceCanvasErrorMock: vi.fn(),
}))

vi.mock(
  "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/runtime/workspace-canvas-logger",
  () => ({
    logWorkspaceCanvasError: logWorkspaceCanvasErrorMock,
  }),
)

describe("workspace canvas v2 config", () => {
  beforeEach(() => {
    logWorkspaceCanvasErrorMock.mockReset()
  })

  it("ignores empty React Flow onError calls", async () => {
    const { handleWorkspaceReactFlowError } = await import(
      "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-config"
    )

    handleWorkspaceReactFlowError(undefined, undefined)
    handleWorkspaceReactFlowError("", "   ")

    expect(logWorkspaceCanvasErrorMock).not.toHaveBeenCalled()
  })

  it("logs meaningful React Flow errors", async () => {
    const { handleWorkspaceReactFlowError } = await import(
      "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-config"
    )

    handleWorkspaceReactFlowError("002", "nodeTypes changed")

    expect(logWorkspaceCanvasErrorMock).toHaveBeenCalledWith("reactflow_error", {
      errorCode: "002",
      message: "nodeTypes changed",
    })
  })

  it("keeps React Flow nodeTypes and edgeTypes as module-level constants", () => {
    const nodeTypesSource = readFileSync(
      join(
        ROOT,
        "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-node-types.tsx",
      ),
      "utf8",
    )
    const viewSource = readFileSync(
      join(
        ROOT,
        "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-view.tsx",
      ),
      "utf8",
    )

    expect(nodeTypesSource).toContain("export const WORKSPACE_CANVAS_V2_NODE_TYPES")
    expect(nodeTypesSource).toContain("export const WORKSPACE_CANVAS_V2_EDGE_TYPES")
    expect(viewSource).toContain("nodeTypes={WORKSPACE_CANVAS_V2_NODE_TYPES}")
    expect(viewSource).toContain("edgeTypes={WORKSPACE_CANVAS_V2_EDGE_TYPES}")
    expect(viewSource).not.toContain("nodeTypes={{")
    expect(viewSource).not.toContain("edgeTypes={{")
  })
})
