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

  it("still includes the tutorial node when the welcome step hides every managed card", () => {
    const tutorialNodeData = {
      id: "workspace-canvas-tutorial",
      type: "workspace-tutorial",
      position: { x: 560, y: 248 },
      draggable: false,
      selectable: false,
      zIndex: 20,
      style: {
        width: 520,
        height: 324,
        minHeight: 324,
      },
      data: {
        stepIndex: 0,
        openedStepIds: [],
        attached: false,
        dragEnabled: false,
        variant: "welcome",
        onPrevious: () => {},
        onNext: () => {},
      },
    } as unknown as NonNullable<
      Parameters<typeof buildInitialWorkspaceCanvasNodes>[0]["tutorialNodeData"]
    >
    const args = {
      visibleCardIds: [],
      boardNodeLookup: new Map(),
      initialPositionLookupRef: {
        current: {},
      } as unknown as MutableRefObject<Record<string, { x: number; y: number }>>,
      cardDataLookup: {},
      allowEditing: true,
      acceleratorStepNodeData: null,
      tutorialNodeData,
    } as unknown as Parameters<typeof buildInitialWorkspaceCanvasNodes>[0]

    const nodes = buildInitialWorkspaceCanvasNodes(args)

    expect(nodes).toHaveLength(1)
    expect(nodes[0]?.id).toBe("workspace-canvas-tutorial")
  })
})
