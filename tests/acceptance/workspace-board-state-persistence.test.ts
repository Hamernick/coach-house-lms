import { describe, expect, it } from "vitest"

import {
  buildWorkspaceBoardStateWithPersistedNodePosition,
  mergeNewerPersistedWorkspaceNodeState,
} from "@/app/(dashboard)/my-organization/_lib/workspace-board-state-persistence"
import { buildDefaultBoardState } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout"

describe("workspace board state persistence", () => {
  it("preserves newer persisted node positions when an older whole-board save arrives", () => {
    const incoming = {
      ...buildDefaultBoardState(),
      updatedAt: "2026-06-04T18:00:00.000Z",
      nodes: buildDefaultBoardState().nodes.map((node) =>
        node.id === "fiscal-sponsorship" ? { ...node, x: 64, y: 720 } : node
      ),
    }
    const persisted = {
      ...incoming,
      updatedAt: "2026-06-04T18:01:00.000Z",
      nodes: incoming.nodes.map((node) =>
        node.id === "fiscal-sponsorship"
          ? {
              ...node,
              x: 420,
              y: 920,
              size: "lg" as const,
              positionMode: "manual" as const,
            }
          : node
      ),
    }

    const merged = mergeNewerPersistedWorkspaceNodeState({
      incoming,
      persisted,
    })

    expect(
      merged.nodes.find((node) => node.id === "fiscal-sponsorship")
    ).toMatchObject({
      x: 420,
      y: 920,
      size: "lg",
    })
  })

  it("keeps incoming node positions when the whole-board save is current", () => {
    const incoming = {
      ...buildDefaultBoardState(),
      updatedAt: "2026-06-04T18:02:00.000Z",
      nodes: buildDefaultBoardState().nodes.map((node) =>
        node.id === "fiscal-sponsorship" ? { ...node, x: 512, y: 968 } : node
      ),
    }
    const persisted = {
      ...incoming,
      updatedAt: "2026-06-04T18:01:00.000Z",
      nodes: incoming.nodes.map((node) =>
        node.id === "fiscal-sponsorship" ? { ...node, x: 64, y: 720 } : node
      ),
    }

    const merged = mergeNewerPersistedWorkspaceNodeState({
      incoming,
      persisted,
    })

    expect(
      merged.nodes.find((node) => node.id === "fiscal-sponsorship")
    ).toMatchObject({
      x: 512,
      y: 968,
    })
  })

  it("preserves saved manual node positions when a newer whole-board save still carries auto-layout coordinates", () => {
    const defaultBoardState = buildDefaultBoardState()
    const fiscalDefaultNode = defaultBoardState.nodes.find(
      (node) => node.id === "fiscal-sponsorship"
    )
    expect(fiscalDefaultNode).toBeTruthy()
    const incoming = {
      ...defaultBoardState,
      updatedAt: "2026-06-04T18:02:00.000Z",
      nodes: defaultBoardState.nodes.map((node) =>
        node.id === "fiscal-sponsorship"
          ? { ...node, x: fiscalDefaultNode!.x, y: fiscalDefaultNode!.y }
          : node
      ),
    }
    const persisted = {
      ...incoming,
      updatedAt: "2026-06-04T18:01:00.000Z",
      nodes: incoming.nodes.map((node) =>
        node.id === "fiscal-sponsorship"
          ? {
              ...node,
              x: 420,
              y: 920,
              size: "lg" as const,
              positionMode: "manual" as const,
            }
          : node
      ),
    }

    const merged = mergeNewerPersistedWorkspaceNodeState({
      incoming,
      persisted,
    })

    expect(
      merged.nodes.find((node) => node.id === "fiscal-sponsorship")
    ).toMatchObject({
      x: 420,
      y: 920,
      size: "lg",
    })
  })

  it("keeps a newer explicit manual node position over an older saved manual position", () => {
    const defaultBoardState = buildDefaultBoardState()
    const incoming = {
      ...defaultBoardState,
      updatedAt: "2026-06-04T18:02:00.000Z",
      nodes: defaultBoardState.nodes.map((node) =>
        node.id === "fiscal-sponsorship"
          ? {
              ...node,
              x: 512,
              y: 968,
              size: "md" as const,
              positionMode: "manual" as const,
            }
          : node
      ),
    }
    const persisted = {
      ...incoming,
      updatedAt: "2026-06-04T18:01:00.000Z",
      nodes: incoming.nodes.map((node) =>
        node.id === "fiscal-sponsorship"
          ? {
              ...node,
              x: 420,
              y: 920,
              size: "lg" as const,
              positionMode: "manual" as const,
            }
          : node
      ),
    }

    const merged = mergeNewerPersistedWorkspaceNodeState({
      incoming,
      persisted,
    })

    expect(
      merged.nodes.find((node) => node.id === "fiscal-sponsorship")
    ).toMatchObject({
      x: 512,
      y: 968,
      size: "md",
      positionMode: "manual",
    })
  })

  it("preserves manual coordinates over newer managed ontology layout coordinates", () => {
    const defaults = buildDefaultBoardState()
    const incoming = {
      ...defaults,
      updatedAt: "2026-06-04T18:02:00.000Z",
      nodes: defaults.nodes.map((node) =>
        node.id === "programs"
          ? {
              ...node,
              x: 900,
              y: 700,
              positionMode: "managed" as const,
            }
          : node
      ),
    }
    const persisted = {
      ...incoming,
      updatedAt: "2026-06-04T18:01:00.000Z",
      nodes: incoming.nodes.map((node) =>
        node.id === "programs"
          ? {
              ...node,
              x: 420,
              y: 520,
              positionMode: "manual" as const,
            }
          : node
      ),
    }

    const merged = mergeNewerPersistedWorkspaceNodeState({
      incoming,
      persisted,
    })

    expect(merged.nodes.find((node) => node.id === "programs")).toMatchObject({
      x: 420,
      y: 520,
      positionMode: "manual",
    })
  })

  it("infers manual ownership for legacy saved coordinates without a mode", () => {
    const defaults = buildDefaultBoardState()
    const persisted = {
      ...defaults,
      updatedAt: "2026-06-04T18:01:00.000Z",
      nodes: defaults.nodes.map((node) => {
        if (node.id !== "programs") return node
        const { positionMode: _positionMode, ...legacyNode } = node
        return { ...legacyNode, x: 420, y: 520 }
      }),
    }

    const merged = mergeNewerPersistedWorkspaceNodeState({
      incoming: {
        ...defaults,
        updatedAt: "2026-06-04T18:02:00.000Z",
      },
      persisted,
    })

    expect(merged.nodes.find((node) => node.id === "programs")).toMatchObject({
      x: 420,
      y: 520,
      positionMode: "manual",
    })
  })

  it("preserves the newest shared ontology revision during whole-board saves", () => {
    const defaults = buildDefaultBoardState()
    const incoming = {
      ...defaults,
      ontology: {
        ...defaults.ontology!,
        updatedAt: "2026-07-19T14:00:00.000Z",
        expandedRootIds: ["organization-overview" as const],
      },
    }
    const persisted = {
      ...defaults,
      ontology: {
        ...defaults.ontology!,
        updatedAt: "2026-07-19T14:01:00.000Z",
        expandedRootIds: ["accelerator" as const],
        pinnedNodeIds: ["ontology:accelerator:module:one"],
        nodePositions: {
          "ontology:accelerator:module:one": { x: 720, y: 440 },
        },
      },
    }

    const merged = mergeNewerPersistedWorkspaceNodeState({
      incoming,
      persisted,
    })

    expect(merged.ontology).toEqual(persisted.ontology)
  })

  it("updates only the targeted node position for dedicated node saves", () => {
    const boardState = buildDefaultBoardState()
    const organizationBefore = boardState.nodes.find(
      (node) => node.id === "organization-overview"
    )

    const next = buildWorkspaceBoardStateWithPersistedNodePosition({
      boardState,
      cardId: "fiscal-sponsorship",
      x: 384,
      y: 944,
    })

    expect(next).not.toBe(boardState)
    expect(
      next.nodes.find((node) => node.id === "fiscal-sponsorship")
    ).toMatchObject({
      x: 384,
      y: 944,
      positionMode: "manual",
    })
    expect(next.nodes.find((node) => node.id === "organization-overview")).toBe(
      organizationBefore
    )
  })
})
