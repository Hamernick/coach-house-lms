import { WORKSPACE_CARD_IDS, type WorkspaceCardId, type WorkspaceLayoutPreset, type WorkspaceNodeState } from "./workspace-board-types"
import { WORKSPACE_EDGE_SPECS } from "./workspace-board-copy"
import { roundToSnap, resolveCardDimensions } from "./workspace-board-layout-config"

type ElkLayoutNode = {
  id: string
  x?: number
  y?: number
  width?: number
  height?: number
}

type ElKLayoutArgs = {
  nodes: WorkspaceNodeState[]
  preset: WorkspaceLayoutPreset
  fallbackNodes: WorkspaceNodeState[]
}

function buildElkOptions(preset: WorkspaceLayoutPreset): Record<string, string> {
  if (preset === "communications-focused") {
    return {
      "elk.algorithm": "org.eclipse.elk.radial",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "64",
      "elk.padding": "[top=48,left=48,bottom=48,right=48]",
    }
  }

  return {
    "elk.algorithm": "org.eclipse.elk.layered",
    "elk.direction": preset === "calendar-focused" ? "DOWN" : "RIGHT",
    "elk.layered.spacing.nodeNodeBetweenLayers": "110",
    "elk.spacing.nodeNode": "80",
    "elk.padding": "[top=48,left=48,bottom=48,right=48]",
  }
}

function collectElkPositions(root: { children?: ElkLayoutNode[] }) {
  const positions = new Map<WorkspaceCardId, { x: number; y: number }>()
  for (const child of root.children ?? []) {
    if (!WORKSPACE_CARD_IDS.includes(child.id as WorkspaceCardId)) continue
    if (!Number.isFinite(child.x) || !Number.isFinite(child.y)) continue
    positions.set(child.id as WorkspaceCardId, {
      x: child.x ?? 0,
      y: child.y ?? 0,
    })
  }
  return positions
}

function normalizeLayoutNodesForPreset({
  nodes,
  positions,
  fallbackNodes,
}: {
  nodes: WorkspaceNodeState[]
  positions: Map<WorkspaceCardId, { x: number; y: number }>
  fallbackNodes: WorkspaceNodeState[]
}): WorkspaceNodeState[] {
  const fallbackLookup = new Map(fallbackNodes.map((node) => [node.id, node]))

  return nodes.map((node) => {
    const position = positions.get(node.id)
    if (!position) {
      return fallbackLookup.get(node.id) ?? node
    }
    return {
      ...node,
      x: roundToSnap(position.x),
      y: roundToSnap(position.y),
    }
  })
}

export async function applyElkAutoLayout({
  nodes,
  preset,
  fallbackNodes,
}: ElKLayoutArgs): Promise<WorkspaceNodeState[]> {
  try {
    const { default: ELK } = await import("elkjs/lib/elk.bundled.js")
    const elk = new ELK()

    const graph = {
      id: "workspace-board",
      layoutOptions: buildElkOptions(preset),
      children: nodes.map((node) => {
        const dimensions = resolveCardDimensions(node.size, node.id)
        return {
          id: node.id,
          width: dimensions.width,
          height: dimensions.height,
        }
      }),
      edges: WORKSPACE_EDGE_SPECS.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    }

    const layout = (await elk.layout(graph)) as { children?: ElkLayoutNode[] }
    const positions = collectElkPositions(layout)
    if (positions.size === 0) {
      return fallbackNodes
    }

    return normalizeLayoutNodesForPreset({
      nodes,
      positions,
      fallbackNodes,
    })
  } catch {
    return fallbackNodes
  }
}
