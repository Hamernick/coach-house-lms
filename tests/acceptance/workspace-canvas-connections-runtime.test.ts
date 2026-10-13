import { describe, expect, it } from "vitest"

import {
  buildWorkspaceCanvasV2Edges,
  resolveWorkspaceCanvasDisconnectActionSets,
  resolveWorkspaceCanvasConnectAttempt,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/runtime/workspace-canvas-connections"
import type { WorkspaceCardReadiness } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/runtime/workspace-canvas-card-readiness"

const READY: WorkspaceCardReadiness = { status: "ready", isReady: true }
const EMPTY: WorkspaceCardReadiness = { status: "empty", isReady: false }

describe("workspace canvas v2 runtime connections", () => {
  it("accepts valid visible connections in edit mode", () => {
    const result = resolveWorkspaceCanvasConnectAttempt({
      connection: {
        source: "organization-overview",
        target: "programs",
      },
      allowEditing: true,
      visibleCardIdSet: new Set([
        "organization-overview",
        "programs",
      ]),
    })

    expect(result).toEqual({
      allowed: true,
      source: "organization-overview",
      target: "programs",
      matchedPortType: "organization-context",
    })
  })

  it("rejects invalid runtime attempts with explicit reasons", () => {
    expect(
      resolveWorkspaceCanvasConnectAttempt({
        connection: {
          source: "organization-overview",
          target: "programs",
        },
        allowEditing: false,
        visibleCardIdSet: new Set([
          "organization-overview",
          "programs",
        ]),
      }),
    ).toEqual({ allowed: false, reason: "read-only" })

    expect(
      resolveWorkspaceCanvasConnectAttempt({
        connection: {
          source: "organization-overview",
          target: "deck",
        },
        allowEditing: true,
        visibleCardIdSet: new Set(["organization-overview"]),
      }),
    ).toEqual({ allowed: false, reason: "unknown-node-id" })

    expect(
      resolveWorkspaceCanvasConnectAttempt({
        connection: {
          source: "organization-overview",
          target: "programs",
        },
        allowEditing: true,
        visibleCardIdSet: new Set(["organization-overview"]),
      }),
    ).toEqual({ allowed: false, reason: "hidden-node-id" })

    expect(
      resolveWorkspaceCanvasConnectAttempt({
        connection: {
          source: "calendar",
          target: "calendar",
        },
        allowEditing: true,
        visibleCardIdSet: new Set(["calendar"]),
      }),
    ).toEqual({ allowed: false, reason: "same-node" })
  })

  it("builds only valid visible card edges and reports dropped ids", () => {
    const { edges, droppedConnectionIds } = buildWorkspaceCanvasV2Edges({
      connections: [
        {
          id: "edge-valid",
          source: "organization-overview",
          target: "programs",
        },
        {
          id: "edge-valid-calendar-to-brand",
          source: "calendar",
          target: "brand-kit",
        },
        {
          id: "edge-unknown-node",
          source: "deck",
          target: "vault",
        },
        {
          id: "edge-hidden-target",
          source: "brand-kit",
          target: "communications",
        },
      ],
      visibleCardIdSet: new Set([
        "organization-overview",
        "programs",
        "brand-kit",
        "calendar",
      ]),
      presentationMode: false,
      readinessMap: {
        "organization-overview": READY,
        programs: READY,
        vault: READY,
        accelerator: READY,
        "brand-kit": EMPTY,
        "economic-engine": EMPTY,
        calendar: READY,
        communications: EMPTY,
      },
      includeAcceleratorStepEdge: true,
      acceleratorWorkspaceNodeId: "accelerator",
      tutorialEdgeTargetId: null,
    })

    expect(edges.map((edge) => edge.id)).toEqual([
      "edge-valid",
      "edge-valid-calendar-to-brand",
      "edge-accelerator-to-active-step",
    ])
    expect(droppedConnectionIds).toEqual([
      "edge-unknown-node",
      "edge-hidden-target",
    ])
  })

  it("keeps real graph edges when the tutorial edge is rendered", () => {
    const { edges } = buildWorkspaceCanvasV2Edges({
      connections: [
        {
          id: "edge-valid",
          source: "organization-overview",
          target: "programs",
        },
      ],
      visibleCardIdSet: new Set([
        "organization-overview",
        "programs",
      ]),
      presentationMode: false,
      readinessMap: {
        "organization-overview": READY,
        programs: READY,
        vault: READY,
        accelerator: READY,
        "brand-kit": EMPTY,
        "economic-engine": EMPTY,
        calendar: READY,
        communications: EMPTY,
      },
      includeAcceleratorStepEdge: false,
      acceleratorWorkspaceNodeId: null,
      tutorialEdgeTargetId: "programs",
    })

    expect(edges.map((edge) => edge.id)).toEqual([
      "edge-valid",
      "workspace-canvas-tutorial-edge",
    ])
    expect(edges.find((edge) => edge.id === "edge-valid")?.zIndex).toBeUndefined()
    expect(edges.find((edge) => edge.id === "workspace-canvas-tutorial-edge")?.zIndex).toBeUndefined()
  })

  it("builds disconnect action sets for right-click edge menu", () => {
    const sets = resolveWorkspaceCanvasDisconnectActionSets({
      connections: [
        {
          id: "edge-org-to-accel",
          source: "organization-overview",
          target: "programs",
        },
        {
          id: "edge-org-to-brand",
          source: "organization-overview",
          target: "brand-kit",
        },
        {
          id: "edge-brand-to-accel",
          source: "brand-kit",
          target: "accelerator",
        },
      ],
      edgeId: "edge-org-to-accel",
      source: "organization-overview",
      target: "programs",
    })

    expect(sets.edgeConnectionIds).toEqual(["edge-org-to-accel"])
    expect(sets.sourceConnectionIds).toEqual([
      "edge-org-to-accel",
      "edge-org-to-brand",
    ])
    expect(sets.targetConnectionIds).toEqual([
      "edge-org-to-accel",
    ])
  })

  it("keeps readiness maps typed for the standalone programs card", () => {
    const readinessMap = {
      "organization-overview": READY,
      programs: READY,
      vault: READY,
      accelerator: READY,
      "brand-kit": EMPTY,
      "economic-engine": EMPTY,
      calendar: READY,
      communications: EMPTY,
    }

    expect(readinessMap.programs).toEqual(READY)
  })
})
