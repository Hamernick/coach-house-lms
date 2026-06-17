import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it, vi } from "vitest"

import {
  WORKSPACE_CANVAS_HELP_TIP_STORAGE_KEY,
  resolveWorkspaceCanvasHelpTipInitialVisibility,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-help-overlay"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("workspace canvas help overlay", () => {
  it("shows the tip when no dismissal has been stored", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn().mockReturnValue(null),
      },
    })

    expect(resolveWorkspaceCanvasHelpTipInitialVisibility()).toBe(true)
    vi.unstubAllGlobals()
  })

  it("keeps the tip hidden after it has been dismissed", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn((key: string) =>
          key === WORKSPACE_CANVAS_HELP_TIP_STORAGE_KEY ? "true" : null
        ),
      },
    })

    expect(resolveWorkspaceCanvasHelpTipInitialVisibility()).toBe(false)
    vi.unstubAllGlobals()
  })

  it("matches the viewport control button treatment for the help trigger", () => {
    const source = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-help-overlay.tsx"
    )
    const globalsSource = readSource("src/app/globals.css")

    expect(source).toContain('variant="ghost"')
    expect(source).toContain(
      'className="pointer-events-auto h-9 w-9 rounded-xl"'
    )
    expect(source).toContain('<InfoIcon className="h-4 w-4" aria-hidden />')
    expect(source).toContain("MousePointer2Icon")
    expect(source).toContain("Select a group")
    expect(source).toContain("Hold Shift and drag a box")
    expect(source).toContain("selecting groups")
    expect(source).toContain('className="flex flex-col gap-1 p-2"')
    expect(source).not.toContain('variant="outline"')
    expect(source).not.toContain("rounded-full shadow-sm backdrop-blur-sm")
    expect(globalsSource).toContain(
      ".workspace-flow .react-flow__node.selected [data-workspace-card]"
    )
    expect(globalsSource).toContain("outline-offset: 3px;")
    expect(globalsSource).not.toContain(
      "0 0 0 6px color-mix(in srgb, var(--ring)"
    )
  })
})
