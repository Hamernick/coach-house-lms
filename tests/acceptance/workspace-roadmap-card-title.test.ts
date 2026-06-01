import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("workspace roadmap card title", () => {
  it("promotes the in-card strategic roadmap label to the visible card title", () => {
    const toc = readSource(
      "src/components/roadmap/roadmap-editor/components/roadmap-editor-toc.tsx"
    )
    const navigator = readSource(
      "src/components/roadmap/roadmap-navigator-section.tsx"
    )
    const roadmapCard = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node-tool-card-roadmap.tsx"
    )
    const nodeCard = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node-card.tsx"
    )
    const resolvedRenderer = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node-card-resolved-renderer.tsx"
    )

    expect(navigator).toContain(
      '"text-[15px] leading-5 font-semibold tracking-tight text-foreground"'
    )
    expect(navigator).toContain("ROADMAP_TOC_TITLE_CLASS_NAME")
    expect(navigator).toContain("<header")
    expect(navigator).toContain(
      '<span className="truncate">Strategic Roadmap</span>'
    )
    expect(navigator).toContain(
      'aria-controls="roadmap-section-picker-trigger"'
    )
    expect(navigator).toContain("handleCollapsedChange")
    expect(navigator).toContain("showHeader ?")
    expect(toc).not.toContain("ROADMAP_TOC_TITLE_CLASS_NAME")
    expect(toc).not.toContain("Strategic Roadmap")
    expect(navigator).not.toContain(
      "text-xs font-semibold text-muted-foreground"
    )
    expect(roadmapCard).toContain("showHeader={false}")
    expect(roadmapCard).toContain("collapsed={collapsed}")
    expect(nodeCard).toContain('cardId === "roadmap" ||')
    expect(nodeCard).toContain("roadmapNavigatorCollapsed")
    expect(resolvedRenderer).toContain(
      'title={cardId === "roadmap" ? "Strategic Roadmap" : cardMeta.title}'
    )
    expect(resolvedRenderer).toContain('hideTitle={cardId === "accelerator"}')
    expect(resolvedRenderer).toContain(
      'aria-controls="roadmap-section-picker-trigger"'
    )
    expect(resolvedRenderer).toContain("collapsed={roadmapNavigatorCollapsed}")
    expect(resolvedRenderer).toContain(
      "onRoadmapNavigatorCollapsedChange(!roadmapNavigatorCollapsed)"
    )
  })
})
