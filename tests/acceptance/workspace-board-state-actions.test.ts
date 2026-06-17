import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("workspace board state actions", () => {
  it("revalidates workspace routes after saving board state", () => {
    const source = readSource(
      "src/app/(dashboard)/my-organization/_lib/workspace-actions.ts"
    )

    expect(source).toContain('import { revalidatePath } from "next/cache"')
    expect(source).toContain('revalidatePath("/workspace")')
    expect(source).toContain('revalidatePath("/my-organization")')
    expect(source).toContain('revalidatePath("/organization/workspace")')
    expect(source.indexOf("revalidateWorkspaceBoardRoutes()")).toBeLessThan(
      source.indexOf("export async function saveWorkspaceBoardStateAction")
    )
    const boardActionSource = source.slice(
      source.indexOf("export async function saveWorkspaceBoardStateAction"),
      source.indexOf("export async function saveWorkspaceNodePositionAction")
    )
    expect(
      boardActionSource.indexOf("revalidateWorkspaceBoardRoutes()")
    ).toBeGreaterThan(boardActionSource.indexOf("if (error) {"))
  })

  it("uses dedicated node-position persistence for dropped canvas nodes", () => {
    const actionSource = readSource(
      "src/app/(dashboard)/my-organization/_lib/workspace-actions.ts"
    )
    const canvasSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-canvas.tsx"
    )

    expect(actionSource).toContain("saveWorkspaceNodePositionAction")
    expect(actionSource).toContain(
      "buildWorkspaceBoardStateWithPersistedNodePosition"
    )
    expect(actionSource).toContain("mergeNewerPersistedWorkspaceNodeState")
    expect(actionSource).toContain(
      "normalizeWorkspaceBoardState(input.boardState)"
    )
    expect(canvasSource).toContain("saveWorkspaceNodePositionAction")
    expect(canvasSource).toContain("boardState: nextBoardState")
    expect(canvasSource).toContain(
      "const response = await saveWorkspaceNodePositionAction"
    )
  })
})
