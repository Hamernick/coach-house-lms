import { describe, expect, it } from "vitest"

import { normalizeWorkspaceCardId } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-card-id"
import {
  WORKSPACE_CARD_META,
  WORKSPACE_EDGE_SPECS,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-copy"
import { normalizeWorkspaceBoardState } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout"
import { resolveWorkspaceDataDrawerRequest } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-drawer-tabs"
import {
  WORKSPACE_CARD_IDS,
  WORKSPACE_FINANCE_CARD_ID,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-types"
import {
  WORKSPACE_DRAWER_TABS,
  WORKSPACE_FINANCE_DRAWER_TAB,
  getWorkspaceDrawerPath,
  normalizeWorkspaceDrawerTab,
} from "@/lib/workspace/routes"

describe("workspace Finance identity", () => {
  it("activates the Finance drawer tab without enabling a card", () => {
    expect(WORKSPACE_FINANCE_CARD_ID).toBe("finance")
    expect(WORKSPACE_FINANCE_CARD_ID).not.toBe("economic-engine")
    expect(WORKSPACE_CARD_IDS).toContain("economic-engine")
    expect(WORKSPACE_CARD_IDS).not.toContain(WORKSPACE_FINANCE_CARD_ID)
    expect(normalizeWorkspaceCardId(WORKSPACE_FINANCE_CARD_ID)).toBeNull()

    expect(WORKSPACE_FINANCE_DRAWER_TAB).toBe("finance")
    expect(WORKSPACE_DRAWER_TABS).toContain(WORKSPACE_FINANCE_DRAWER_TAB)
    expect(normalizeWorkspaceDrawerTab(WORKSPACE_FINANCE_DRAWER_TAB)).toBe(
      WORKSPACE_FINANCE_DRAWER_TAB
    )
    expect(getWorkspaceDrawerPath({ tab: WORKSPACE_FINANCE_DRAWER_TAB })).toBe(
      "/workspace?drawer=finance"
    )
    expect(
      resolveWorkspaceDataDrawerRequest("/workspace?drawer=finance")
    ).toEqual({ tab: WORKSPACE_FINANCE_DRAWER_TAB })
  })

  it("keeps reserved Finance layout state opaque until activation", () => {
    const financeNode = {
      id: WORKSPACE_FINANCE_CARD_ID,
      x: 820,
      y: 640,
      size: "lg",
      positionMode: "manual",
      futureMetadata: { view: "overview" },
    }
    const financeConnection = {
      id: "edge-organization-to-finance",
      source: "organization-overview",
      target: WORKSPACE_FINANCE_CARD_ID,
    }
    const normalized = normalizeWorkspaceBoardState({
      nodes: [financeNode],
      connections: [financeConnection],
      hiddenCardIds: [WORKSPACE_FINANCE_CARD_ID],
    })

    expect(normalized.nodes).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: WORKSPACE_FINANCE_CARD_ID }),
      ])
    )
    expect(normalized.forwardCompatibility).toEqual({
      nodes: [financeNode],
      connections: [financeConnection],
      hiddenCardIds: [WORKSPACE_FINANCE_CARD_ID],
    })
  })

  it("locks the existing economic-engine identity and connection", () => {
    const financeCardId: string = WORKSPACE_FINANCE_CARD_ID

    expect(WORKSPACE_CARD_META["economic-engine"]).toEqual({
      title: "Fundraising",
      subtitle: "Funding architecture and pipeline health",
      fullHref: "/workspace?view=editor&tab=programs",
    })
    expect(WORKSPACE_EDGE_SPECS).toContainEqual({
      id: "edge-accelerator-to-economic",
      source: "accelerator",
      target: "economic-engine",
    })
    expect(
      WORKSPACE_EDGE_SPECS.some(
        (edge) => edge.source === financeCardId || edge.target === financeCardId
      )
    ).toBe(false)
  })
})
