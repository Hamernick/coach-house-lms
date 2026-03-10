import type { MutableRefObject } from "react"
import { describe, expect, it } from "vitest"

import { buildInitialWorkspaceCanvasNodes } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-node-builders"

describe("workspace canvas v2 node builders", () => {
  it("keeps revealed workspace cards draggable when editing is allowed", () => {
    const args = {
      visibleCardIds: ["organization-overview"],
      boardNodeLookup: new Map([
        [
          "organization-overview",
          { id: "organization-overview", x: 120, y: 220, size: "md" },
        ],
      ]),
      initialPositionLookupRef: {
        current: {
          "organization-overview": { x: 120, y: 220 },
        },
      } as unknown as MutableRefObject<
        Record<"organization-overview", { x: number; y: number }>
      >,
      cardDataLookup: {
        "organization-overview": {
          size: "md",
        },
      },
      allowEditing: true,
      acceleratorStepNodeData: null,
      tutorialNodeData: null,
    } as unknown as Parameters<typeof buildInitialWorkspaceCanvasNodes>[0]

    const nodes = buildInitialWorkspaceCanvasNodes(args)

    expect(nodes).toHaveLength(1)
    expect(nodes[0]?.id).toBe("organization-overview")
    expect(nodes[0]?.draggable).toBe(true)
  })
})
