import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import type { ReactFlowInstance } from "reactflow"
import type { RoadmapSection } from "@/lib/roadmap/types"
import { ParticleRoadmapContent } from "@/features/workspace-particles/components/particle-roadmap-content"
import { describe, expect, it, vi } from "vitest"
import {
  activateExistingCanvasNode,
  normalizeWorkspaceParticleState,
  emptyWorkspaceParticleState,
  removeParticle,
  resizeParticle,
  googleParticleUrl,
  isParticleImagePath,
  PARTICLE_SIZES,
  preferNewerParticleState,
  buildParticleSources,
  partitionWorkspaceParticleNodeChanges,
} from "@/features/workspace-particles/client"
import {
  buildDefaultBoardState,
  normalizeWorkspaceBoardState,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout"
import {
  mergeNewerPersistedWorkspaceNodeState,
  reconcileWorkspaceBoardSaveResult,
} from "@/app/(dashboard)/my-organization/_lib/workspace-board-state-persistence"
import type { ParticlePlacement } from "@/features/workspace-particles"

const item: ParticlePlacement = {
  id: "particle-mission",
  source: { kind: "roadmap", id: "mission" },
  x: 10,
  y: 20,
  size: "mini",
}
const image = {
  id: "image-one",
  title: "Workshop",
  path: "00000000-0000-0000-0000-000000000001/particles/00000000-0000-0000-0000-000000000002.png",
}
const state = {
  ...emptyWorkspaceParticleState(),
  items: [item],
  images: [image],
  updatedAt: "2026-09-16T06:00:00.000Z",
}

describe("workspace particles", () => {
  it("round-trips linked references, sizes, images and positions through board storage", () => {
    const board = normalizeWorkspaceBoardState({
      ...buildDefaultBoardState(),
      particles: state,
    })
    expect(board.particles).toEqual(state)
    expect(JSON.stringify(board.particles)).not.toContain("content")
  })
  it("recovers particles after an older client saves only the compatibility envelope", () => {
    const board = normalizeWorkspaceBoardState({
      ...buildDefaultBoardState(),
      particles: state,
    })
    const { particles: _particles, ...olderClientPayload } = board
    expect(normalizeWorkspaceBoardState(olderClientPayload).particles).toEqual(
      state
    )
  })
  it("leaves older boards without particles unchanged", () => {
    expect(
      normalizeWorkspaceBoardState(buildDefaultBoardState()).particles
    ).toBeUndefined()
  })
  it("deduplicates sources and drops malformed or non-finite placements", () => {
    const normalized = normalizeWorkspaceParticleState({
      items: [
        item,
        { ...item, id: "particle-duplicate" },
        { ...item, id: "bad" },
        { ...item, x: Infinity },
        null,
        { ...item, source: { kind: "script", id: "x" } },
      ],
    })
    expect(normalized.items).toEqual([item])
  })
  it("removes legacy duplicate organization and activity placements", () => {
    const organizationItem: ParticlePlacement = {
      ...item,
      id: "particle-organization",
      source: { kind: "organization", id: "organization-one" },
    }
    const activityItem: ParticlePlacement = {
      ...item,
      id: "particle-activity",
      source: { kind: "activity", id: "workspace-activity" },
    }

    expect(
      normalizeWorkspaceParticleState({
        items: [organizationItem, activityItem],
      }).items
    ).toEqual([])
  })
  it("builds linked organization and activity sources from Workspace data", () => {
    const sources = buildParticleSources(
      [],
      [],
      [],
      {
        id: "organization-one",
        title: "Southside Community Table",
        subtitle: "Neighborhood meals and mentoring",
        programsCount: 3,
        peopleCount: 12,
        fundingGoalCents: 1000000,
        raisedCents: 250000,
      },
      [
        {
          id: "calendar:event-one",
          source: "calendar",
          status: "scheduled",
          title: "Board meeting",
          timestamp: "2026-09-20T18:00:00.000Z",
          href: "/my-organization?tab=calendar",
        },
      ]
    )

    expect(sources).toEqual([
      expect.objectContaining({
        ref: { kind: "organization", id: "organization-one" },
        title: "Southside Community Table",
        href: "/workspace?drawer=organization",
        canvasNodeId: "organization-overview",
      }),
      expect.objectContaining({
        ref: { kind: "activity", id: "workspace-activity" },
        title: "Activity",
        canvasNodeId: "programs",
        activities: [
          expect.objectContaining({
            id: "calendar:event-one",
            title: "Board meeting",
          }),
        ],
      }),
    ])
  })
  it("moves an existing Workspace card instead of creating a particle", () => {
    const onPlace = vi.fn(() => true)
    const flow = {
      getNode: vi.fn(() => ({
        id: "programs",
        position: { x: 20, y: 30 },
        width: 300,
        height: 200,
      })),
      screenToFlowPosition: vi.fn((point) => point),
    } as unknown as ReactFlowInstance

    expect(
      activateExistingCanvasNode({
        flow,
        source: {
          ref: { kind: "activity", id: "workspace-activity" },
          title: "Activity",
          description: "Current activity",
          available: true,
          canvasNodeId: "programs",
        },
        point: { x: 500, y: 400 },
        onPlace,
      })
    ).toBe("moved")
    expect(onPlace).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "programs",
        position: { x: 350, y: 300 },
      })
    )
  })
  it("bounds canvas coordinates and the number of rendered items", () => {
    const items = Array.from({ length: 120 }, (_, index) => ({
      ...item,
      id: `particle-${index}`,
      source: { kind: "roadmap", id: `section-${index}` },
      x: 999999,
      y: -999999,
    }))
    const normalized = normalizeWorkspaceParticleState({ items })
    expect(normalized.items).toHaveLength(100)
    expect(normalized.items[0]).toMatchObject({ x: 50000, y: -50000 })
  })
  it("partitions particle changes before the main canvas pipeline", () => {
    const particleChange = {
      id: "particle-mission",
      type: "position" as const,
      position: { x: 20, y: 30 },
      dragging: true,
    }
    const workspaceChange = {
      id: "organization-overview",
      type: "select" as const,
      selected: true,
    }

    expect(
      partitionWorkspaceParticleNodeChanges([particleChange, workspaceChange])
    ).toEqual({
      particleChanges: [particleChange],
      workspaceChanges: [workspaceChange],
    })
  })
  it("removes only the placement and related connections, preserving the source image", () => {
    const next = removeParticle(
      {
        ...state,
        connections: [
          { id: "edge", source: item.id, target: "organization-overview" },
        ],
      },
      item.id
    )
    expect(next.items).toEqual([])
    expect(next.connections).toEqual([])
    expect(next.images).toEqual([image])
  })
  it("keeps the visual center fixed through all three size changes", () => {
    for (const size of ["icon", "mini", "large"] as const) {
      const next = resizeParticle(item, size)
      expect(next.x + PARTICLE_SIZES[size].width / 2).toBe(
        item.x + PARTICLE_SIZES.mini.width / 2
      )
      expect(next.y + PARTICLE_SIZES[size].height / 2).toBe(
        item.y + PARTICLE_SIZES.mini.height / 2
      )
    }
  })
  it("rejects dangling, duplicate, self and non-particle connections", () => {
    const edge = {
      id: "edge",
      source: item.id,
      target: "organization-overview",
    }
    const next = normalizeWorkspaceParticleState({
      ...state,
      connections: [
        edge,
        edge,
        { ...edge, target: item.id },
        { ...edge, target: "particle-missing" },
        { ...edge, source: "one", target: "two" },
      ],
    })
    expect(next.connections).toHaveLength(1)
    expect(next.connections[0]).toMatchObject({
      source: item.id,
      target: "organization-overview",
    })
  })
  it("preserves particles across stale saves and applies the saved particle result", () => {
    const older = { ...state, items: [], updatedAt: "2026-09-16T05:00:00Z" }
    const incoming = { ...buildDefaultBoardState(), particles: older }
    const persisted = { ...incoming, particles: state }
    expect(
      mergeNewerPersistedWorkspaceNodeState({ incoming, persisted }).particles
    ).toEqual(state)
    expect(
      reconcileWorkspaceBoardSaveResult({ current: incoming, persisted })
        .particles
    ).toEqual(state)
    expect(preferNewerParticleState(undefined, state)).toBe(state)
  })
  it("constructs Google editor links from validated IDs rather than supplied URLs", () => {
    expect(
      googleParticleUrl({
        id: "attachment-uuid",
        fileId: "abc_123",
        name: "Doc",
        mimeType: "application/vnd.google-apps.document",
        status: "available",
      })
    ).toBe("https://docs.google.com/document/d/abc_123/edit")
    expect(
      googleParticleUrl({
        id: "attachment-uuid",
        fileId: "../malicious",
        name: "Doc",
        mimeType: "text/html",
        status: "available",
      })
    ).toBeNull()
  })
  it.each([
    "https://example.com/image.png",
    "../other/image.png",
    image.path.replace(".png", ".svg"),
    image.path + "?token=secret",
  ])("rejects unsafe image references: %s", (path) => {
    expect(isParticleImagePath(path)).toBe(false)
    expect(
      normalizeWorkspaceParticleState({ images: [{ ...image, path }] }).images
    ).toEqual([])
  })
})

describe("linked roadmap rendering", () => {
  const section: RoadmapSection = {
    id: "budget",
    slug: "budget",
    title: "Budget",
    subtitle: "",
    content: "",
    lastUpdated: null,
    isPublic: false,
    layout: "wide",
    status: "in_progress",
    templateTitle: "Budget",
    templateSubtitle: "",
    titleIsTemplate: false,
    subtitleIsTemplate: false,
  }
  it("renders structured budget data without requiring a second content copy", () => {
    const html = renderToStaticMarkup(
      createElement(ParticleRoadmapContent, {
        section: {
          ...section,
          budgetRows: [
            {
              category: "Training",
              description: "Tools",
              costType: "Fixed",
              unit: "Item",
              units: "5",
              costPerUnit: "$10",
              totalCost: "$50",
            },
          ],
        },
      })
    )
    expect(html).toContain("Training")
    expect(html).toContain("$50")
    expect(html).not.toContain("ready for your ideas")
  })
  it("sanitizes HTML before displaying a linked section", () => {
    const html = renderToStaticMarkup(
      createElement(ParticleRoadmapContent, {
        section: {
          ...section,
          content:
            '<p>Our purpose</p><script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">unsafe</a>',
        },
      })
    )
    expect(html).toContain("Our purpose")
    expect(html).not.toMatch(/<script|onerror|javascript:/)
  })
})
