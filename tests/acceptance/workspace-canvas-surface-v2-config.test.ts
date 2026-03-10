import { beforeEach, describe, expect, it, vi } from "vitest"

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
})
