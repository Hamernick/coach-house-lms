import { describe, expect, it } from "vitest"

import { buildWorkspaceOntologyTransitionWave } from "@/features/workspace-ontology/lib/transition-wave"
import type {
  WorkspaceOntologyLayoutNode,
  WorkspaceOntologyProjectedEdge,
} from "@/features/workspace-ontology/types"

function buildNode(id: string, depth: number): WorkspaceOntologyLayoutNode {
  return {
    id,
    label: id,
    description: "",
    category: "organization",
    kind: "test",
    status: "in-progress",
    statusLabel: "In progress",
    relationshipLabel: "Contains",
    href: null,
    actionLabel: null,
    rootId: "organization-overview",
    parentId: depth === 1 ? "organization-overview" : `node-${depth - 1}`,
    depth,
    childCount: 0,
    hasChildren: false,
    position: { x: depth * 100, y: 0 },
    size: { width: 280, height: 112 },
  }
}

function buildEdge(
  id: string,
  source: string,
  target: string
): WorkspaceOntologyProjectedEdge {
  return {
    id,
    source,
    target,
    label: "Contains",
    category: "organization",
    status: "in-progress",
    kind: "hierarchy",
    showLabel: false,
  }
}

const NODES = [
  buildNode("node-1", 1),
  buildNode("node-2", 2),
  buildNode("node-3", 3),
]
const EDGES = [
  buildEdge("edge-1", "organization-overview", "node-1"),
  buildEdge("edge-2", "node-1", "node-2"),
  buildEdge("edge-3", "node-2", "node-3"),
]

describe("workspace ontology transition wave", () => {
  it("reveals edges before nodes in outward path order", () => {
    const transition = buildWorkspaceOntologyTransitionWave({
      previousNodes: [],
      nextNodes: [...NODES].reverse(),
      previousEdges: [],
      nextEdges: [...EDGES].reverse(),
      nodePhases: new Map(NODES.map((node) => [node.id, "entering"])),
      edgePhases: new Map(EDGES.map((edge) => [edge.id, "entering"])),
    })

    expect(NODES.map((node) => transition.nodeDelays.get(node.id))).toEqual([
      32, 88, 144,
    ])
    expect(EDGES.map((edge) => transition.edgeDelays.get(edge.id))).toEqual([
      0, 56, 112,
    ])
    expect(transition.duration).toBe(384)
  })

  it("retracts the path from the outside back toward its root", () => {
    const transition = buildWorkspaceOntologyTransitionWave({
      previousNodes: NODES,
      nextNodes: [],
      previousEdges: EDGES,
      nextEdges: [],
      nodePhases: new Map(NODES.map((node) => [node.id, "exiting"])),
      edgePhases: new Map(EDGES.map((edge) => [edge.id, "exiting"])),
    })

    expect(NODES.map((node) => transition.nodeDelays.get(node.id))).toEqual([
      112, 56, 0,
    ])
    expect(EDGES.map((edge) => transition.edgeDelays.get(edge.id))).toEqual([
      136, 80, 24,
    ])
    expect(transition.duration).toBe(282)
  })
})
