import { describe, expect, it } from "vitest"

import {
  arrangeWorkspaceOntologyBranchGeometry,
  buildDefaultWorkspaceOntologyState,
  buildWorkspaceOntologyProjection,
  layoutWorkspaceOntology,
  type WorkspaceOntologyInput,
  type WorkspaceOntologyObstacle,
  type WorkspaceOntologyRootGeometry,
  type WorkspaceOntologyRootId,
} from "../../src/features/workspace-ontology"

const ROOT_IDS = [
  "organization-overview",
  "programs",
  "accelerator",
  "roadmap",
  "calendar",
  "fiscal-sponsorship",
] as const

const CATEGORY_BY_ROOT = {
  "organization-overview": "organization",
  programs: "programs",
  accelerator: "accelerator",
  roadmap: "roadmap",
  calendar: "calendar",
  "fiscal-sponsorship": "fiscal",
} as const

function buildInput(
  rootIds: readonly WorkspaceOntologyRootId[],
  childCount = 8
): WorkspaceOntologyInput {
  return {
    roots: rootIds.map((rootId) => ({
      id: rootId,
      label: rootId,
      children: Array.from({ length: childCount }, (_, index) => ({
        id: `ontology:${rootId}:${index}`,
        label: `${rootId} ${index + 1}`,
        description: "Operational record.",
        category: CATEGORY_BY_ROOT[rootId],
        kind: "Record",
        status:
          index === 0
            ? ("blocked" as const)
            : index === 1
              ? ("missing" as const)
              : ("in-progress" as const),
        statusLabel: index < 2 ? "Needs attention" : "In progress",
        relationshipLabel: "contains",
        href: null,
        actionLabel: "Open",
      })),
    })),
  }
}

function buildRootGeometry(rootIds: readonly WorkspaceOntologyRootId[]) {
  return Object.fromEntries(
    rootIds.map((rootId, index) => [
      rootId,
      { x: index * 420, y: 0, width: 360, height: 240 },
    ])
  ) as Partial<Record<WorkspaceOntologyRootId, WorkspaceOntologyRootGeometry>>
}

function buildRootObstacles(
  rootGeometry: Partial<
    Record<WorkspaceOntologyRootId, WorkspaceOntologyRootGeometry>
  >
) {
  return Object.entries(rootGeometry).map(([id, geometry]) => ({
    id,
    ...geometry,
  }))
}

function rectanglesOverlap(
  left: WorkspaceOntologyRootGeometry,
  right: WorkspaceOntologyRootGeometry,
  gap = 0
) {
  return !(
    left.x + left.width + gap <= right.x ||
    right.x + right.width + gap <= left.x ||
    left.y + left.height + gap <= right.y ||
    right.y + right.height + gap <= left.y
  )
}

function nodeRectangle(node: {
  position: { x: number; y: number }
  size: { width: number; height: number }
}) {
  return { ...node.position, ...node.size }
}

async function solve({
  input,
  rootGeometry,
  obstacles,
  expandedRootIds,
}: {
  input: WorkspaceOntologyInput
  rootGeometry: Partial<
    Record<WorkspaceOntologyRootId, WorkspaceOntologyRootGeometry>
  >
  obstacles: WorkspaceOntologyObstacle[]
  expandedRootIds: WorkspaceOntologyRootId[]
}) {
  const projection = buildWorkspaceOntologyProjection({
    input,
    state: {
      ...buildDefaultWorkspaceOntologyState(),
      expandedRootIds,
    },
    filter: { query: "", categories: [] },
  })
  const layoutRootGeometry = arrangeWorkspaceOntologyBranchGeometry({
    projection,
    rootGeometry,
    obstacles,
  })
  return {
    layoutRootGeometry,
    nodes: await layoutWorkspaceOntology({
      projection,
      rootGeometry: layoutRootGeometry,
    }),
  }
}

describe("workspace ontology anchored branch layout", () => {
  it("keeps primary geometry untouched and solves independently of expansion order", async () => {
    const input = buildInput(["organization-overview", "accelerator"])
    const rootGeometry = buildRootGeometry([
      "organization-overview",
      "accelerator",
    ])
    const originalGeometry = structuredClone(rootGeometry)
    const obstacles = buildRootObstacles(rootGeometry)

    const forward = await solve({
      input,
      rootGeometry,
      obstacles,
      expandedRootIds: ["organization-overview", "accelerator"],
    })
    const reverse = await solve({
      input,
      rootGeometry,
      obstacles,
      expandedRootIds: ["accelerator", "organization-overview"],
    })

    expect(rootGeometry).toEqual(originalGeometry)
    expect(reverse).toEqual(forward)
  })

  it("returns the saved root geometry when every branch is collapsed", () => {
    const input = buildInput(["organization-overview", "accelerator"])
    const rootGeometry = buildRootGeometry([
      "organization-overview",
      "accelerator",
    ])
    const projection = buildWorkspaceOntologyProjection({
      input,
      state: buildDefaultWorkspaceOntologyState(),
      filter: { query: "", categories: [] },
    })

    expect(
      arrangeWorkspaceOntologyBranchGeometry({
        projection,
        rootGeometry,
        obstacles: buildRootObstacles(rootGeometry),
      })
    ).toEqual(rootGeometry)
  })

  it("keeps generated details clear of fixed roots and staff", async () => {
    const input = buildInput(["organization-overview"], 18)
    const rootGeometry = buildRootGeometry([
      "organization-overview",
      "accelerator",
    ])
    const obstacles: WorkspaceOntologyObstacle[] = [
      ...buildRootObstacles(rootGeometry),
      {
        id: "workspace-person:staff-1",
        x: 840,
        y: -120,
        width: 220,
        height: 520,
      },
    ]
    const { nodes } = await solve({
      input,
      rootGeometry,
      obstacles,
      expandedRootIds: ["organization-overview"],
    })

    for (const node of nodes) {
      for (const obstacle of obstacles) {
        expect(rectanglesOverlap(nodeRectangle(node), obstacle, 32)).toBe(false)
      }
    }
  })

  it("packs six attention-first detail lanes without collisions", async () => {
    const input = buildInput(ROOT_IDS, 18)
    const rootGeometry = buildRootGeometry(ROOT_IDS)
    const { nodes } = await solve({
      input,
      rootGeometry,
      obstacles: buildRootObstacles(rootGeometry),
      expandedRootIds: [...ROOT_IDS],
    })

    expect(nodes).toHaveLength(108)
    for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < nodes.length;
        rightIndex += 1
      ) {
        expect(
          rectanglesOverlap(
            nodeRectangle(nodes[leftIndex]),
            nodeRectangle(nodes[rightIndex]),
            32
          )
        ).toBe(false)
      }
    }

    const left = Math.min(...nodes.map((node) => node.position.x))
    const right = Math.max(
      ...nodes.map((node) => node.position.x + node.size.width)
    )
    const top = Math.min(...nodes.map((node) => node.position.y))
    const bottom = Math.max(
      ...nodes.map((node) => node.position.y + node.size.height)
    )
    expect(right - left).toBeLessThanOrEqual(6_500)
    expect(bottom - top).toBeLessThanOrEqual(3_200)
  })
})
