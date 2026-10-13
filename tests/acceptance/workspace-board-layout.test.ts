import { describe, expect, it } from "vitest"

import {
  applyAutoLayout,
  buildDefaultBoardState,
  normalizeWorkspaceBoardState,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout"

import { WORKSPACE_CARD_IDS, type WorkspaceNodeState } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-types"

describe("workspace board layout", () => {
  it("builds a complete default board", () => {
    const state = buildDefaultBoardState("balanced")
    expect(state.nodes).toHaveLength(WORKSPACE_CARD_IDS.length)
    expect(state.communications.channel).toBe("social")
    expect(state.communications.mediaMode).toBe("text")
    expect(state.communications.copy.length).toBeGreaterThan(0)

    const ids = new Set(state.nodes.map((node) => node.id))
    expect(ids.size).toBe(WORKSPACE_CARD_IDS.length)
    for (const id of WORKSPACE_CARD_IDS) {
      expect(ids.has(id)).toBe(true)
    }
  })

  it("normalizes partial payloads into a full board", () => {
    const normalized = normalizeWorkspaceBoardState({
      preset: "calendar-focused",
      nodes: [
        {
          id: "calendar",
          x: 10,
          y: 20,
          size: "sm",
        },
      ],
      communications: {
        channel: "email",
        mediaMode: "video",
        copy: "Board update draft",
        scheduledFor: "2026-02-23T15:00:00.000Z",
        connectedChannels: {
          email: true,
        },
      },
    })

    expect(normalized.preset).toBe("calendar-focused")
    expect(normalized.nodes).toHaveLength(WORKSPACE_CARD_IDS.length)
    expect(normalized.communications.channel).toBe("email")
    expect(normalized.communications.mediaMode).toBe("video")
    expect(normalized.communications.copy).toBe("Board update draft")
    expect(normalized.communications.connectedChannels.email).toBe(true)
    expect(normalized.communications.connectedChannels.social).toBe(false)
    expect(normalized.communications.channelConnections.email.connected).toBe(true)
    expect(normalized.communications.channelConnections.social.connected).toBe(false)
    const calendar = normalized.nodes.find((node) => node.id === "calendar")
    expect(calendar?.x).toBe(10)
    expect(calendar?.y).toBe(20)
  })

  it("normalizes malformed communications payload safely", () => {
    const normalized = normalizeWorkspaceBoardState({
      communications: {
        channel: "unknown",
        mediaMode: "unknown",
        copy: "",
        scheduledFor: "not-a-date",
        connectedChannels: {
          social: "yes",
        },
        activityByDay: {
          "2026-02-20": {
            status: "posted",
            channel: "blog",
            timestamp: "2026-02-20T11:00:00.000Z",
          },
          nope: {
            status: "draft",
          },
        },
      },
    })

    expect(normalized.communications.channel).toBe("social")
    expect(normalized.communications.mediaMode).toBe("text")
    expect(normalized.communications.copy.length).toBeGreaterThan(0)
    expect(normalized.communications.connectedChannels.social).toBe(true)
    expect(normalized.communications.connectedChannels.email).toBe(false)
    expect(normalized.communications.channelConnections.social.connected).toBe(true)
    expect(normalized.communications.channelConnections.email.connected).toBe(false)
    expect(Object.keys(normalized.communications.activityByDay)).toContain("2026-02-20")
    expect(Object.keys(normalized.communications.activityByDay)).not.toContain("nope")
  })

  it("preserves card sizing when applying auto layout", async () => {
    const nodes: WorkspaceNodeState[] = WORKSPACE_CARD_IDS.map((id, index) => ({
      id,
      x: index * 20,
      y: index * 10,
      size: id === "calendar" ? "sm" : "md",
    }))

    const next = await applyAutoLayout(nodes, "communications-focused")
    const calendar = next.find((node) => node.id === "calendar")
    const organization = next.find((node) => node.id === "organization-overview")

    expect(calendar?.size).toBe("sm")
    expect(organization?.size).toBe("md")
    expect(next).toHaveLength(WORKSPACE_CARD_IDS.length)
  })

  it("places the organization card in the center column of the dashboard grid preset", () => {
    const state = buildDefaultBoardState("balanced")

    const formation = state.nodes.find((node) => node.id === "formation-status")
    const organization = state.nodes.find((node) => node.id === "organization-overview")
    const calendar = state.nodes.find((node) => node.id === "calendar")
    const brandKit = state.nodes.find((node) => node.id === "brand-kit")

    expect(formation).toBeTruthy()
    expect(organization).toBeTruthy()
    expect(calendar).toBeTruthy()
    expect(brandKit).toBeTruthy()

    expect(formation!.x).toBeLessThan(organization!.x)
    expect(organization!.x).toBeLessThan(calendar!.x)
    expect(brandKit!.y).toBeGreaterThan(organization!.y)
  })
})
