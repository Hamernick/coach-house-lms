import { describe, expect, it } from "vitest"

import {
  applyWorkspaceOntologyStateToParams,
  buildDefaultWorkspaceOntologyState,
  buildWorkspaceOntologyProjection,
  layoutWorkspaceOntology,
  normalizeWorkspaceOntologyState,
  readWorkspaceOntologyUrlState,
  type WorkspaceOntologyInput,
} from "../../src/features/workspace-ontology"

const INPUT: WorkspaceOntologyInput = {
  roots: [
    {
      id: "organization-overview",
      label: "Organization",
      children: [
        {
          id: "ontology:organization:formation",
          label: "Formation",
          description: "Establish the organization.",
          category: "organization",
          kind: "Phase",
          status: "missing",
          statusLabel: "Needs attention",
          relationshipLabel: "includes",
          href: null,
          actionLabel: null,
          children: [
            ...(
              [
                ["blocked", "blocked"],
                ["missing", "missing"],
                ["current", "in-progress"],
                ["later", "in-progress"],
                ["complete-one", "complete"],
                ["complete-two", "complete"],
              ] as const
            ).map(([id, status]) => ({
              id: `ontology:organization:${id}`,
              label: id,
              description: "Formation action.",
              category: "organization" as const,
              kind: "Action",
              status,
              statusLabel: status,
              relationshipLabel: "requires",
              href: `/workspace/${id}`,
              actionLabel: "Open",
            })),
          ],
        },
      ],
    },
    {
      id: "accelerator",
      label: "Accelerator",
      children: [],
    },
  ],
}

describe("guided workspace ontology focus", () => {
  it("shows three prioritized actions plus compact more and completion rollups", () => {
    const projection = buildWorkspaceOntologyProjection({
      input: INPUT,
      state: {
        ...buildDefaultWorkspaceOntologyState(),
        expandedRootIds: ["organization-overview"],
        expandedNodeIds: ["ontology:organization:formation"],
      },
      filter: { query: "", categories: [] },
    })
    const formationList = projection.nodes.find(
      (node) => node.listParentId === "ontology:organization:formation"
    )

    expect(projection.activeNodeIds).toEqual([
      "ontology:organization:formation",
    ])
    expect(
      formationList?.items
        ?.filter((node) => node.presentation === "action")
        .map((node) => node.id)
    ).toEqual([
      "ontology:organization:blocked",
      "ontology:organization:missing",
      "ontology:organization:current",
    ])
    expect(
      formationList?.items?.find((node) => node.presentation === "more")
    ).toMatchObject({ label: "1 more action", status: "in-progress" })
    expect(
      formationList?.items?.find((node) => node.presentation === "rollup")
    ).toMatchObject({ label: "2 completed", status: "complete" })
    expect(projection.nodes.every((node) => node.presentation === "list")).toBe(
      true
    )
    expect(projection.edges.filter((edge) => edge.active)).toHaveLength(2)
  })

  it("keeps Map complete while Focus remains bounded", () => {
    const focusState = {
      ...buildDefaultWorkspaceOntologyState(),
      expandedRootIds: ["organization-overview"] as const,
      expandedNodeIds: ["ontology:organization:formation"],
    }
    const focus = buildWorkspaceOntologyProjection({
      input: INPUT,
      state: {
        ...focusState,
        expandedRootIds: [...focusState.expandedRootIds],
      },
      filter: { query: "", categories: [] },
    })
    const map = buildWorkspaceOntologyProjection({
      input: INPUT,
      state: {
        ...focusState,
        mode: "map",
        expandedRootIds: [...focusState.expandedRootIds],
      },
      filter: { query: "", categories: [] },
    })

    expect(focus.nodes).toHaveLength(2)
    expect(map.nodes).toHaveLength(7)
    expect(map.nodes.some((node) => node.presentation === "rollup")).toBe(false)
    expect(map.activeNodeIds).toEqual([])
    expect(map.edges.every((edge) => !edge.active)).toBe(true)
  })

  it("normalizes one Focus root and round-trips complete Map state", () => {
    expect(
      normalizeWorkspaceOntologyState({
        ...buildDefaultWorkspaceOntologyState(),
        expandedRootIds: ["organization-overview", "accelerator"],
      }).expandedRootIds
    ).toEqual(["organization-overview"])

    const focusParams = new URLSearchParams(
      "workspace-details=organization-overview,accelerator"
    )
    expect(readWorkspaceOntologyUrlState(focusParams).expandedRootIds).toEqual([
      "organization-overview",
    ])

    const mapParams = applyWorkspaceOntologyStateToParams(
      new URLSearchParams(),
      {
        ...buildDefaultWorkspaceOntologyState(),
        mode: "map",
        expandedRootIds: ["organization-overview", "accelerator"],
      }
    )
    expect(mapParams.get("workspace-view")).toBe("map")
    expect(readWorkspaceOntologyUrlState(mapParams)).toMatchObject({
      mode: "map",
      expandedRootIds: ["organization-overview", "accelerator"],
    })
  })

  it("assigns exactly one x coordinate to each semantic depth", async () => {
    const projection = buildWorkspaceOntologyProjection({
      input: INPUT,
      state: {
        ...buildDefaultWorkspaceOntologyState(),
        mode: "map",
        expandedRootIds: ["organization-overview"],
      },
      filter: { query: "", categories: [] },
    })
    const layout = await layoutWorkspaceOntology({
      projection,
      rootGeometry: {
        "organization-overview": { x: 0, y: 0, width: 360, height: 240 },
      },
    })
    const xByDepth = new Map<number, Set<number>>()
    for (const node of layout) {
      xByDepth.set(node.depth, new Set(xByDepth.get(node.depth) ?? []))
      xByDepth.get(node.depth)?.add(node.position.x)
    }

    expect(
      [...xByDepth.values()].every((positions) => positions.size === 1)
    ).toBe(true)
    expect([...xByDepth.keys()].sort()).toEqual([1, 2])
  })
})
