import { describe, expect, it } from "vitest"

import {
  applyAutoLayout,
  buildDefaultBoardState,
  buildPresetNodes,
  normalizeWorkspaceBoardState,
  resolveCardDimensions,
  sanitizeWorkspaceBoardHiddenState,
  toggleWorkspaceBoardCardVisibility,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout"

import {
  WORKSPACE_CARD_IDS,
  type WorkspaceNodeState,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-types"

describe("workspace board layout", () => {
  function findNode(nodes: WorkspaceNodeState[], id: WorkspaceNodeState["id"]) {
    const node = nodes.find((entry) => entry.id === id)
    expect(node).toBeTruthy()
    return node!
  }

  it("builds a complete default board", () => {
    const state = buildDefaultBoardState("balanced")
    expect(state.nodes).toHaveLength(WORKSPACE_CARD_IDS.length)
    expect(state.autoLayoutMode).toBe("timeline")
    expect(state.communications.channel).toBe("social")
    expect(state.communications.mediaMode).toBe("text")
    expect(state.communications.copy.length).toBeGreaterThan(0)
    expect(state.onboardingFlow.tutorialStepIndex).toBe(0)

    const ids = new Set(state.nodes.map((node) => node.id))
    expect(ids.size).toBe(WORKSPACE_CARD_IDS.length)
    for (const id of WORKSPACE_CARD_IDS) {
      expect(ids.has(id)).toBe(true)
    }
    expect(state.hiddenCardIds).toEqual(
      expect.arrayContaining(["brand-kit", "deck", "atlas"]),
    )
  })

  it("clamps communications cards away from small sizing during normalization", () => {
    const normalized = normalizeWorkspaceBoardState({
      nodes: [
        {
          id: "communications",
          x: 10,
          y: 20,
          size: "sm",
        },
      ],
    })

    const communications = normalized.nodes.find((node) => node.id === "communications")
    expect(communications?.size).toBe("md")
  })

  it("migrates legacy hub layout mode to dagre tree", () => {
    const normalized = normalizeWorkspaceBoardState({
      autoLayoutMode: "hub",
    })

    expect(normalized.autoLayoutMode).toBe("dagre-tree")
  })

  it("keeps the communications card wider at medium and large sizes", () => {
    expect(resolveCardDimensions("md", "communications")).toEqual({
      width: 560,
      height: 620,
    })
    expect(resolveCardDimensions("lg", "communications")).toEqual({
      width: 640,
      height: 720,
    })
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
    expect(normalized.onboardingFlow.tutorialStepIndex).toBe(0)
    expect(normalized.communications.connectedChannels.email).toBe(true)
    expect(normalized.communications.connectedChannels.social).toBe(false)
    expect(normalized.communications.channelConnections.email.connected).toBe(
      true
    )
    expect(normalized.communications.channelConnections.social.connected).toBe(
      false
    )
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
    expect(normalized.communications.channelConnections.social.connected).toBe(
      true
    )
    expect(normalized.communications.channelConnections.email.connected).toBe(
      false
    )
    expect(Object.keys(normalized.communications.activityByDay)).toContain(
      "2026-02-20"
    )
    expect(Object.keys(normalized.communications.activityByDay)).not.toContain(
      "nope"
    )
  })

  it("normalizes malformed accelerator progress payload safely", () => {
    const normalized = normalizeWorkspaceBoardState({
      accelerator: {
        activeStepId: 42,
        completedStepIds: ["module-1:lesson", null, "module-2:assignment", ""],
      },
    })

    expect(normalized.accelerator.activeStepId).toBeNull()
    expect(normalized.accelerator.completedStepIds).toEqual([
      "module-1:lesson",
      "module-2:assignment",
    ])
  })

  it("keeps the organization root visible when payload attempts to hide every card", () => {
    const normalized = normalizeWorkspaceBoardState({
      hiddenCardIds: [...WORKSPACE_CARD_IDS],
    })

    expect(normalized.hiddenCardIds).not.toContain("organization-overview")
    expect(normalized.hiddenCardIds).toContain("accelerator")
  })

  it("allows a root-only visible payload after normalization", () => {
    const normalized = normalizeWorkspaceBoardState({
      hiddenCardIds: WORKSPACE_CARD_IDS.filter((cardId) => cardId !== "vault"),
    })

    expect(normalized.hiddenCardIds).not.toContain("organization-overview")
    expect(normalized.hiddenCardIds).toContain("accelerator")
    expect(normalized.hiddenCardIds).not.toContain("vault")
  })

  it("removes organization from hidden payloads even when other core cards are hidden", () => {
    const normalized = normalizeWorkspaceBoardState({
      hiddenCardIds: ["organization-overview", "accelerator", "calendar", "communications"],
    })

    expect(normalized.hiddenCardIds).not.toContain("organization-overview")
    expect(normalized.hiddenCardIds).toContain("accelerator")
    expect(normalized.hiddenCardIds).toContain("calendar")
    expect(normalized.hiddenCardIds).toContain("communications")
  })

  it("reopening accelerator restores the trunk but leaves descendants hidden", () => {
    const initial = buildDefaultBoardState("balanced")
    const withAcceleratorHidden = toggleWorkspaceBoardCardVisibility(
      initial,
      "accelerator"
    )
    expect(withAcceleratorHidden.hiddenCardIds).toContain("accelerator")
    expect(withAcceleratorHidden.hiddenCardIds).toContain("economic-engine")
    expect(withAcceleratorHidden.hiddenCardIds).toContain("calendar")
    expect(withAcceleratorHidden.hiddenCardIds).toContain("communications")

    const withAcceleratorVisible = toggleWorkspaceBoardCardVisibility(
      withAcceleratorHidden,
      "accelerator"
    )
    expect(withAcceleratorVisible.hiddenCardIds).not.toContain("accelerator")
    expect(withAcceleratorVisible.hiddenCardIds).toEqual([
      "brand-kit",
      "economic-engine",
      "calendar",
      "communications",
      "deck",
      "atlas",
    ])
  })

  it("hiding accelerator mutates only accelerator and its descendants", () => {
    const initial = buildDefaultBoardState("balanced")
    const withAcceleratorHidden = toggleWorkspaceBoardCardVisibility(
      initial,
      "accelerator"
    )

    expect(withAcceleratorHidden.hiddenCardIds).toEqual([
      "accelerator",
      "brand-kit",
      "economic-engine",
      "calendar",
      "communications",
      "deck",
      "atlas",
    ])
  })

  it("hiding documents hides the entire downstream branch", () => {
    const initial = buildDefaultBoardState("balanced")
    const next = toggleWorkspaceBoardCardVisibility(initial, "vault")

    expect(next.hiddenCardIds).toEqual([
      "accelerator",
      "brand-kit",
      "economic-engine",
      "calendar",
      "communications",
      "deck",
      "vault",
      "atlas",
    ])
    expect(next.hiddenCardIds).not.toContain("organization-overview")
  })

  it("keeps accelerator toggles in the same two rooted-tree states", () => {
    let next = buildDefaultBoardState("balanced")
    for (let index = 0; index < 12; index += 1) {
      next = toggleWorkspaceBoardCardVisibility(next, "accelerator")
    }

    expect(next.hiddenCardIds).toEqual([
      "brand-kit",
      "economic-engine",
      "calendar",
      "communications",
      "deck",
      "atlas",
    ])
  })

  it("allows hiding accelerator when only two cards are visible", () => {
    const baseline = buildDefaultBoardState("balanced")
    const twoVisibleHiddenCardIds = WORKSPACE_CARD_IDS.filter(
      (cardId) => cardId !== "accelerator" && cardId !== "organization-overview"
    )
    const twoVisibleState = {
      ...baseline,
      hiddenCardIds: twoVisibleHiddenCardIds,
    }

    const after = toggleWorkspaceBoardCardVisibility(twoVisibleState, "accelerator")
    expect(after.hiddenCardIds).toContain("accelerator")
    expect(after.hiddenCardIds).not.toContain("organization-overview")
  })

  it("does not allow hiding the organization root when only two cards are visible", () => {
    const baseline = buildDefaultBoardState("balanced")
    const twoVisibleHiddenCardIds = WORKSPACE_CARD_IDS.filter(
      (cardId) => cardId !== "accelerator" && cardId !== "organization-overview"
    )
    const twoVisibleState = {
      ...baseline,
      hiddenCardIds: twoVisibleHiddenCardIds,
    }

    const after = toggleWorkspaceBoardCardVisibility(twoVisibleState, "organization-overview")
    expect(after.hiddenCardIds).not.toContain("organization-overview")
    expect(after.hiddenCardIds).not.toContain("accelerator")
  })

  it("hiding accelerator from a root-plus-accelerator state keeps the root visible", () => {
    const baseline = buildDefaultBoardState("balanced")
    const onlyAcceleratorVisibleState = {
      ...baseline,
      hiddenCardIds: WORKSPACE_CARD_IDS.filter((cardId) => cardId !== "accelerator"),
    }

    const afterHide = toggleWorkspaceBoardCardVisibility(onlyAcceleratorVisibleState, "accelerator")
    expect(afterHide.hiddenCardIds).toContain("accelerator")
    expect(afterHide.hiddenCardIds).not.toContain("organization-overview")

    const afterReopen = toggleWorkspaceBoardCardVisibility(afterHide, "accelerator")
    expect(afterReopen.hiddenCardIds).not.toContain("accelerator")
    expect(afterReopen.hiddenCardIds).not.toContain("organization-overview")
  })

  it("hiding accelerator removes the accelerator branch from the visible set", () => {
    const initial = buildDefaultBoardState("balanced")
    const countVisible = (state: ReturnType<typeof buildDefaultBoardState>) =>
      state.nodes.filter((node) => !state.hiddenCardIds.includes(node.id)).length

    const before = countVisible(initial)
    const after = countVisible(
      toggleWorkspaceBoardCardVisibility(initial, "accelerator")
    )

    expect(before - after).toBe(4)
  })

  it("does not no-op accelerator toggle when legacy hidden state omitted tool defaults", () => {
    const baseline = buildDefaultBoardState("balanced")
    const legacyState = {
      ...baseline,
      hiddenCardIds: [],
    }

    const after = toggleWorkspaceBoardCardVisibility(legacyState, "accelerator")
    expect(after.hiddenCardIds).toContain("accelerator")
    expect(after.hiddenCardIds).toContain("brand-kit")
    expect(after.hiddenCardIds).toContain("deck")
    expect(after.hiddenCardIds).toContain("atlas")
  })

  it("sanitizes hidden-card payloads into a valid root-only visible state", () => {
    const state = buildDefaultBoardState("balanced")
    const corrupted = {
      ...state,
      hiddenCardIds: [...WORKSPACE_CARD_IDS],
    }

    const sanitized = sanitizeWorkspaceBoardHiddenState(corrupted)
    expect(sanitized.hiddenCardIds).toEqual([
      "programs",
      "accelerator",
      "brand-kit",
      "economic-engine",
      "calendar",
      "communications",
      "deck",
      "vault",
      "atlas",
    ])
    expect(sanitized.visibility?.allCardsHiddenExplicitly).toBe(false)
  })

  it("preserves a valid root-only visible state for non-explicit all-hidden payloads", () => {
    const state = buildDefaultBoardState("balanced")
    const poisoned = {
      ...state,
      hiddenCardIds: [...WORKSPACE_CARD_IDS],
      visibility: {
        allCardsHiddenExplicitly: false,
      },
    }

    const sanitized = sanitizeWorkspaceBoardHiddenState(poisoned)
    expect(sanitized.hiddenCardIds).toEqual([
      "programs",
      "accelerator",
      "brand-kit",
      "economic-engine",
      "calendar",
      "communications",
      "deck",
      "vault",
      "atlas",
    ])
    expect(sanitized.visibility?.allCardsHiddenExplicitly).toBe(false)
  })

  it("collapses explicit all-hidden state into a fixed-root state", () => {
    const state = buildDefaultBoardState("balanced")
    const intentionallyAllHidden = {
      ...state,
      hiddenCardIds: [...WORKSPACE_CARD_IDS],
      visibility: {
        allCardsHiddenExplicitly: true,
      },
    }

    const sanitized = sanitizeWorkspaceBoardHiddenState(intentionallyAllHidden)
    expect(sanitized.hiddenCardIds).toEqual([
      "programs",
      "accelerator",
      "brand-kit",
      "economic-engine",
      "calendar",
      "communications",
      "deck",
      "vault",
      "atlas",
    ])
    expect(sanitized.visibility?.allCardsHiddenExplicitly).toBe(false)
  })

  it("migrates legacy formation-status identifiers to accelerator", () => {
    const normalized = normalizeWorkspaceBoardState({
      nodes: [
        {
          id: "formation-status",
          x: 128,
          y: 256,
          size: "sm",
        },
      ],
      connections: [
        {
          id: "legacy-edge",
          source: "organization-overview",
          target: "formation-status",
        },
      ],
      hiddenCardIds: ["formation-status"],
    })

    const acceleratorNode = normalized.nodes.find((node) => node.id === "accelerator")
    expect(acceleratorNode?.x).toBe(128)
    expect(acceleratorNode?.y).toBe(256)
    expect(normalized.connections.some((connection) => connection.target === "accelerator")).toBe(true)
    expect(normalized.hiddenCardIds).toContain("accelerator")
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
    const organization = next.find(
      (node) => node.id === "organization-overview"
    )

    expect(calendar?.size).toBe("sm")
    expect(organization?.size).toBe("md")
    expect(next).toHaveLength(WORKSPACE_CARD_IDS.length)
  })

  it("places programs between organization and accelerator in the dashboard grid preset", () => {
    const nodes = buildPresetNodes("balanced")

    const programs = findNode(nodes, "programs")
    const accelerator = findNode(nodes, "accelerator")
    const organization = findNode(nodes, "organization-overview")
    const calendar = findNode(nodes, "calendar")
    const brandKit = findNode(nodes, "brand-kit")

    expect(organization.x).toBeLessThan(programs.x)
    expect(programs.x).toBeLessThan(accelerator.x)
    expect(accelerator.x).toBeLessThan(calendar.x)
    expect(brandKit.y).toBeGreaterThan(organization.y)
  })

  it("keeps the calendar-focused preset with calendar between programs and accelerator", async () => {
    const state = buildDefaultBoardState("calendar-focused")
    const laidOut = await applyAutoLayout(state.nodes, "calendar-focused")

    const programs = findNode(laidOut, "programs")
    const accelerator = findNode(laidOut, "accelerator")
    const calendar = findNode(laidOut, "calendar")
    const communications = findNode(laidOut, "communications")
    const organization = findNode(laidOut, "organization-overview")

    expect(organization.x).toBeLessThan(programs.x)
    expect(programs.x).toBeLessThan(calendar.x)
    expect(calendar.x).toBeLessThan(accelerator.x)
    expect(calendar.y).toBeLessThan(communications.y)
  })

  it("keeps the communications-focused preset with communications between programs and accelerator", async () => {
    const state = buildDefaultBoardState("communications-focused")
    const laidOut = await applyAutoLayout(state.nodes, "communications-focused")

    const programs = findNode(laidOut, "programs")
    const accelerator = findNode(laidOut, "accelerator")
    const communications = findNode(laidOut, "communications")
    const calendar = findNode(laidOut, "calendar")
    const organization = findNode(laidOut, "organization-overview")

    expect(organization.x).toBeLessThan(programs.x)
    expect(programs.x).toBeLessThan(communications.x)
    expect(communications.x).toBeLessThan(accelerator.x)
    expect(communications.x).toBeLessThan(calendar.x)
    expect(communications.y).toBeLessThan(calendar.y)
  })

  it("applies dagre-tree autolayout as a horizontal tree", async () => {
    const state = buildDefaultBoardState("balanced")
    const laidOut = await applyAutoLayout(state.nodes, "dagre-tree", {
      connections: state.connections,
    })

    const programs = findNode(laidOut, "programs")
    const vault = findNode(laidOut, "vault")
    const organization = findNode(laidOut, "organization-overview")
    const accelerator = findNode(laidOut, "accelerator")
    const communications = findNode(laidOut, "communications")
    const economicEngine = findNode(laidOut, "economic-engine")
    const calendar = findNode(laidOut, "calendar")

    expect(organization.x).toBeLessThan(vault.x)
    expect(organization.x).toBeLessThan(programs.x)
    expect(programs.x).toBeGreaterThan(organization.x)
    expect(accelerator.x).toBeGreaterThan(vault.x)
    expect(accelerator.x).toBeGreaterThan(programs.x)
    expect(communications.x).toBeGreaterThan(accelerator.x)
    expect(economicEngine.x).toBeGreaterThan(accelerator.x)
    expect(calendar.x).toBeGreaterThan(accelerator.x)
    expect(
      new Set([economicEngine.y, calendar.y, communications.y]).size,
    ).toBeGreaterThan(1)
  })

  it("applies timeline autolayout with a trunk row and compact leaf stack", async () => {
    const state = buildDefaultBoardState("balanced")
    const laidOut = await applyAutoLayout(state.nodes, "timeline")

    const organization = findNode(laidOut, "organization-overview")
    const vault = findNode(laidOut, "vault")
    const accelerator = findNode(laidOut, "accelerator")
    const communications = findNode(laidOut, "communications")
    const economicEngine = findNode(laidOut, "economic-engine")
    const calendar = findNode(laidOut, "calendar")

    expect(organization.x).toBeLessThan(vault.x)
    expect(vault.x).toBeLessThan(accelerator.x)
    expect(accelerator.x).toBeLessThan(economicEngine.x)
    expect(economicEngine.x).toBe(calendar.x)
    expect(calendar.x).toBe(communications.x)
    expect(economicEngine.y).toBeLessThan(calendar.y)
    expect(calendar.y).toBeLessThan(communications.y)
  })
})
