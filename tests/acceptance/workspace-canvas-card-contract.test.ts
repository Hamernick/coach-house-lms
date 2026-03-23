import { describe, expect, it } from "vitest"

import {
  WORKSPACE_CANVAS_V2_CARD_CONTRACT,
  WORKSPACE_CANVAS_V2_CARD_IDS,
  WORKSPACE_CANVAS_V2_DOCK_CARD_IDS,
  WORKSPACE_CARD_PORT_TYPES,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/contracts/workspace-card-contract"

describe("workspace canvas card contract", () => {
  it("keeps dock cards aligned with declared card ids", () => {
    expect(WORKSPACE_CANVAS_V2_DOCK_CARD_IDS.length).toBeGreaterThan(0)
    expect(typeof WORKSPACE_CANVAS_V2_DOCK_CARD_IDS.map).toBe("function")
    for (const cardId of WORKSPACE_CANVAS_V2_DOCK_CARD_IDS) {
      expect(WORKSPACE_CANVAS_V2_CARD_IDS.includes(cardId)).toBe(true)
    }
  })

  it("keeps lane index unique and strictly ordered by base card sequence", () => {
    const laneIndexes = WORKSPACE_CANVAS_V2_CARD_IDS.map(
      (cardId) => WORKSPACE_CANVAS_V2_CARD_CONTRACT[cardId].laneIndex,
    )
    const orderedLaneIndexes = [...laneIndexes].sort((left, right) => left - right)

    expect(new Set(laneIndexes).size).toBe(laneIndexes.length)
    for (let index = 1; index < orderedLaneIndexes.length; index += 1) {
      expect(orderedLaneIndexes[index]).toBeGreaterThan(
        orderedLaneIndexes[index - 1] ?? -1,
      )
    }
  })

  it("keeps default card positions aligned to the canvas grid", () => {
    for (const cardId of WORKSPACE_CANVAS_V2_CARD_IDS) {
      const { x, y } = WORKSPACE_CANVAS_V2_CARD_CONTRACT[cardId].defaultPosition
      expect(x).toBeGreaterThanOrEqual(0)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(x % 8).toBe(0)
      expect(y % 8).toBe(0)
    }
  })

  it("keeps each card default size inside its allowed size set", () => {
    for (const cardId of WORKSPACE_CANVAS_V2_CARD_IDS) {
      const contract = WORKSPACE_CANVAS_V2_CARD_CONTRACT[cardId]
      expect(
        contract.allowedSizes.some((size) => size === contract.defaultSize),
      ).toBe(true)
    }
  })

  it("keeps communications and fundraising out of the dock while brand-kit stays deprecated", () => {
    expect(WORKSPACE_CANVAS_V2_CARD_CONTRACT.communications.allowedSizes).toEqual(["md", "lg"])
    expect(WORKSPACE_CANVAS_V2_CARD_CONTRACT.communications.defaultSize).toBe("md")
    expect(WORKSPACE_CANVAS_V2_CARD_CONTRACT.communications.dockEnabled).toBe(false)
    expect(WORKSPACE_CANVAS_V2_DOCK_CARD_IDS.includes("communications")).toBe(false)
    expect(WORKSPACE_CANVAS_V2_CARD_CONTRACT["economic-engine"].dockEnabled).toBe(false)
    expect(WORKSPACE_CANVAS_V2_DOCK_CARD_IDS.includes("economic-engine")).toBe(false)
    expect(WORKSPACE_CANVAS_V2_CARD_CONTRACT["brand-kit"].dockEnabled).toBe(false)
    expect(WORKSPACE_CANVAS_V2_DOCK_CARD_IDS.includes("brand-kit")).toBe(false)
  })

  it("keeps the accelerator canvas contract free of internal scroll-region assumptions", () => {
    expect(WORKSPACE_CANVAS_V2_CARD_CONTRACT.accelerator.scrollPolicy).toBe("none")
  })

  it("keeps card ports aligned to the shared port type vocabulary", () => {
    for (const cardId of WORKSPACE_CANVAS_V2_CARD_IDS) {
      const contract = WORKSPACE_CANVAS_V2_CARD_CONTRACT[cardId]
      for (const input of contract.ports.inputs) {
        expect(WORKSPACE_CARD_PORT_TYPES.includes(input)).toBe(true)
      }
      for (const output of contract.ports.outputs) {
        expect(WORKSPACE_CARD_PORT_TYPES.includes(output)).toBe(true)
      }
    }
  })

  it("keeps exactly one hub center card and one timeline root card", () => {
    const hubCenters = WORKSPACE_CANVAS_V2_CARD_IDS.filter(
      (cardId) => WORKSPACE_CANVAS_V2_CARD_CONTRACT[cardId].layoutRoles.hub === "center",
    )
    const timelineRoots = WORKSPACE_CANVAS_V2_CARD_IDS.filter(
      (cardId) => WORKSPACE_CANVAS_V2_CARD_CONTRACT[cardId].layoutRoles.timeline === "root",
    )

    expect(hubCenters).toEqual(["roadmap"])
    expect(timelineRoots).toEqual(["organization-overview"])
  })
})
