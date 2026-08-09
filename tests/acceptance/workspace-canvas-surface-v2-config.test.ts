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
  })
)

describe("workspace canvas v2 config", () => {
  beforeEach(() => {
    logWorkspaceCanvasErrorMock.mockReset()
  })

  it("ignores empty React Flow onError calls", async () => {
    const { handleWorkspaceReactFlowError } =
      await import("@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-config")

    handleWorkspaceReactFlowError(undefined, undefined)
    handleWorkspaceReactFlowError("", "   ")

    expect(logWorkspaceCanvasErrorMock).not.toHaveBeenCalled()
  })

  it("logs meaningful React Flow errors", async () => {
    const { handleWorkspaceReactFlowError } =
      await import("@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-config")

    handleWorkspaceReactFlowError("002", "nodeTypes changed")

    expect(logWorkspaceCanvasErrorMock).toHaveBeenCalledWith(
      "reactflow_error",
      {
        errorCode: "002",
        message: "nodeTypes changed",
      }
    )
  })

  it("keeps board camera moves long enough for the cubic speed ramp", async () => {
    const {
      WORKSPACE_CANVAS_V2_ACCELERATOR_FOCUS_OPTIONS,
      WORKSPACE_CANVAS_V2_CARD_FOCUS_OPTIONS,
      WORKSPACE_CANVAS_V2_LAYOUT_FIT_OPTIONS,
      WORKSPACE_CANVAS_V2_TUTORIAL_SCENE_FIT_OPTIONS,
      WORKSPACE_CANVAS_V2_ZOOM_PUNCH_MS,
    } =
      await import("@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-config")

    expect(WORKSPACE_CANVAS_V2_ZOOM_PUNCH_MS).toBe(420)
    expect(WORKSPACE_CANVAS_V2_CARD_FOCUS_OPTIONS.duration).toBe(460)
    expect(WORKSPACE_CANVAS_V2_ACCELERATOR_FOCUS_OPTIONS.duration).toBe(480)
    expect(WORKSPACE_CANVAS_V2_LAYOUT_FIT_OPTIONS.duration).toBe(520)
    expect(WORKSPACE_CANVAS_V2_TUTORIAL_SCENE_FIT_OPTIONS.duration).toBe(520)
  })

  it("keeps React Flow nodeTypes and edgeTypes as module-level constants", () => {
    const nodeTypesSource = readFileSync(
      join(
        ROOT,
        "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-node-types.tsx"
      ),
      "utf8"
    )
    const viewSource = readFileSync(
      join(
        ROOT,
        "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-view.tsx"
      ),
      "utf8"
    )
    const bootstrapSource = readFileSync(
      join(
        ROOT,
        "src/components/workspace/workspace-reactflow-error-bootstrap.tsx"
      ),
      "utf8"
    )

    expect(nodeTypesSource).toContain(
      "export const WORKSPACE_CANVAS_V2_NODE_TYPES"
    )
    expect(nodeTypesSource).toContain(
      "export const WORKSPACE_CANVAS_V2_EDGE_TYPES"
    )
    expect(viewSource).toContain(
      "const nodeTypes = useMemo(() => WORKSPACE_CANVAS_V2_NODE_TYPES, [])"
    )
    expect(viewSource).toContain(
      "const edgeTypes = useMemo(() => WORKSPACE_CANVAS_V2_EDGE_TYPES, [])"
    )
    expect(viewSource).toContain("nodeTypes={nodeTypes}")
    expect(viewSource).toContain("edgeTypes={edgeTypes}")
    expect(viewSource).toContain("ReactFlowProvider")
    expect(viewSource).toContain("<WorkspaceReactFlowErrorBootstrap")
    expect(bootstrapSource).toContain(
      "if (errorCode === REACT_FLOW_TYPES_WARNING_CODE) return"
    )
    expect(bootstrapSource).toContain("useLayoutEffect(() => {")
    expect(bootstrapSource).toContain(
      "store.setState({ onError: handleReactFlowError })"
    )
    expect(bootstrapSource).toContain("setReady(true)")
    expect(bootstrapSource).toContain("if (!ready) return null")
    expect(bootstrapSource).not.toContain(
      "onErrorRef.current = onError\n  const handleReactFlowError"
    )
    expect(viewSource).not.toContain("store.setState")
    expect(viewSource).not.toContain("nodeTypes={{")
    expect(viewSource).not.toContain("edgeTypes={{")
  })
})
