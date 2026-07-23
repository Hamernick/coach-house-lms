import { describe, expect, it } from "vitest"

import {
  mergeUniqueWorkspaceCanvasEdges,
  mergeUniqueWorkspaceCanvasNodes,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-edge-deduplication"
import {
  buildDefaultWorkspaceOntologyState,
  buildWorkspaceOntologyProjection,
  type WorkspaceOntologyInput,
  type WorkspaceOntologyNodeInput,
} from "@/features/workspace-ontology"

function ontologyNode(id: string, label: string): WorkspaceOntologyNodeInput {
  return {
    id,
    label,
    description: `${label} description`,
    category: "organization",
    kind: "Test node",
    status: "in-progress",
    statusLabel: "In progress",
    relationshipLabel: "contains",
    href: null,
    actionLabel: null,
  }
}

describe("workspace ontology identity", () => {
  it("projects one canonical node and edge for duplicate identities", () => {
    const input: WorkspaceOntologyInput = {
      roots: [
        {
          id: "organization-overview",
          label: "Organization",
          children: [
            ontologyNode("ontology:shared", "Canonical shared node"),
            ontologyNode("ontology:target", "Target node"),
            ontologyNode("programs", "Invalid root collision"),
          ],
        },
        {
          id: "programs",
          label: "Activity",
          children: [ontologyNode("ontology:shared", "Duplicate shared node")],
        },
      ],
      relationships: [
        {
          id: "relationship-primary",
          source: "ontology:shared",
          target: "ontology:target",
          label: "connects to",
          category: "organization",
          status: "in-progress",
        },
        {
          id: "relationship-duplicate-endpoints",
          source: "ontology:shared",
          target: "ontology:target",
          label: "duplicates",
          category: "organization",
          status: "in-progress",
        },
        {
          id: "relationship-self",
          source: "ontology:shared",
          target: "ontology:shared",
          label: "invalid self edge",
          category: "organization",
          status: "in-progress",
        },
        {
          id: "relationship-orphan",
          source: "ontology:missing",
          target: "ontology:target",
          label: "invalid orphan edge",
          category: "organization",
          status: "in-progress",
        },
      ],
    }

    const projection = buildWorkspaceOntologyProjection({
      input,
      state: {
        ...buildDefaultWorkspaceOntologyState(),
        expandedRootIds: ["organization-overview", "programs"],
      },
      filter: { query: "", categories: [] },
    })
    const relationshipEdges = projection.edges.filter(
      (edge) => edge.kind === "relationship"
    )

    expect(projection.allNodes.map((node) => node.id)).toEqual([
      "ontology:shared",
      "ontology:target",
    ])
    expect(
      projection.nodes.find((node) => node.id === "ontology:shared")
    ).toMatchObject({
      label: "Canonical shared node",
      rootId: "organization-overview",
    })
    expect(relationshipEdges).toEqual([
      expect.objectContaining({
        id: "relationship-primary",
        source: "ontology:shared",
        target: "ontology:target",
      }),
    ])
    expect(new Set(projection.edges.map((edge) => edge.id)).size).toBe(
      projection.edges.length
    )
  })

  it("keeps the first node and edge identity when final graph layers merge", () => {
    const nodes = mergeUniqueWorkspaceCanvasNodes(
      [
        {
          id: "shared-node",
          position: { x: 0, y: 0 },
          data: { label: "Canvas owner" },
        },
      ],
      [
        {
          id: "shared-node",
          position: { x: 100, y: 100 },
          data: { label: "Ontology duplicate" },
        },
        {
          id: "ontology-node",
          position: { x: 200, y: 100 },
          data: { label: "Ontology node" },
        },
      ]
    )
    const edges = mergeUniqueWorkspaceCanvasEdges(
      [
        {
          id: "shared-edge",
          source: "root",
          target: "shared-node",
          label: "Canvas owner",
        },
      ],
      [
        {
          id: "shared-edge",
          source: "root",
          target: "ontology-node",
          label: "Duplicate id",
        },
        {
          id: "duplicate-endpoints",
          source: "root",
          target: "shared-node",
          label: "Duplicate endpoints",
        },
        {
          id: "ontology-edge",
          source: "shared-node",
          target: "ontology-node",
          label: "Ontology edge",
        },
      ]
    )

    expect(nodes.map((node) => node.id)).toEqual([
      "shared-node",
      "ontology-node",
    ])
    expect(nodes[0]?.data).toEqual({ label: "Canvas owner" })
    expect(edges.map((edge) => edge.id)).toEqual([
      "shared-edge",
      "ontology-edge",
    ])
    expect(edges[0]).toMatchObject({
      source: "root",
      target: "shared-node",
      label: "Canvas owner",
    })
  })
})
