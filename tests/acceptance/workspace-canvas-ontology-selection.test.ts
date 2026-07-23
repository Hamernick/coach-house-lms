import { describe, expect, it } from "vitest"
import type { NodeChange } from "reactflow"

import { applyWorkspaceOntologySelectionChanges } from "../../src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-ontology-selection"

describe("workspace ontology selection", () => {
  it("tracks selected ontology nodes without treating positions as selection", () => {
    const selectedIds = new Set(["ontology:organization:mission"])
    const changes = [
      {
        id: "ontology:organization:mission",
        type: "select",
        selected: false,
      },
      {
        id: "ontology:accelerator:legal",
        type: "select",
        selected: true,
      },
      {
        id: "ontology:accelerator:legal",
        type: "position",
        position: { x: 320, y: 160 },
        dragging: false,
      },
    ] satisfies NodeChange[]

    expect(
      Array.from(
        applyWorkspaceOntologySelectionChanges({ selectedIds, changes })
      )
    ).toEqual(["ontology:accelerator:legal"])
  })

  it("preserves the same set when no selection changed", () => {
    const selectedIds = new Set(["ontology:organization:mission"])
    const result = applyWorkspaceOntologySelectionChanges({
      selectedIds,
      changes: [],
    })

    expect(result).toBe(selectedIds)
  })
})
