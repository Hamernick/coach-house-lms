import type {
  WorkspaceOntologyLayoutNode,
  WorkspaceOntologyProjectedEdge,
} from "../types"

export const WORKSPACE_ONTOLOGY_LAYOUT_MOVE_MS = 240
export const WORKSPACE_ONTOLOGY_NODE_ENTER_MS = 240
export const WORKSPACE_ONTOLOGY_NODE_EXIT_MS = 170
export const WORKSPACE_ONTOLOGY_EDGE_ENTER_MS = 180
export const WORKSPACE_ONTOLOGY_EDGE_EXIT_MS = 130

const WAVE_NODE_LEAD_MS = 32
const WAVE_EDGE_LAG_MS = 24
const WAVE_STEP_MS = 56
const WAVE_MAX_SPAN_MS = 336

export type WorkspaceOntologyTransitionPhase = "entering" | "stable" | "exiting"

type TransitionWaveInput = {
  previousNodes: WorkspaceOntologyLayoutNode[]
  nextNodes: WorkspaceOntologyLayoutNode[]
  previousEdges: WorkspaceOntologyProjectedEdge[]
  nextEdges: WorkspaceOntologyProjectedEdge[]
  nodePhases: ReadonlyMap<string, WorkspaceOntologyTransitionPhase>
  edgePhases: ReadonlyMap<string, WorkspaceOntologyTransitionPhase>
}

function compareNodesOutward(
  left: WorkspaceOntologyLayoutNode,
  right: WorkspaceOntologyLayoutNode
) {
  return (
    left.depth - right.depth ||
    left.position.x - right.position.x ||
    left.position.y - right.position.y ||
    left.id.localeCompare(right.id)
  )
}

function resolveWaveStep(itemCount: number) {
  if (itemCount <= 1) return 0
  return Math.min(WAVE_STEP_MS, WAVE_MAX_SPAN_MS / (itemCount - 1))
}

function buildNodeDelays({
  previousNodes,
  nextNodes,
  nodePhases,
}: Pick<TransitionWaveInput, "previousNodes" | "nextNodes" | "nodePhases">) {
  const enteringNodes = nextNodes
    .filter((node) => nodePhases.get(node.id) === "entering")
    .sort(compareNodesOutward)
  const exitingNodes = previousNodes
    .filter((node) => nodePhases.get(node.id) === "exiting")
    .sort((left, right) => compareNodesOutward(right, left))
  const delays = new Map<string, number>()
  const enteringStep = resolveWaveStep(enteringNodes.length)
  const exitingStep = resolveWaveStep(exitingNodes.length)

  enteringNodes.forEach((node, index) => {
    delays.set(node.id, WAVE_NODE_LEAD_MS + index * enteringStep)
  })
  exitingNodes.forEach((node, index) => {
    delays.set(node.id, index * exitingStep)
  })
  return delays
}

function resolveConnectedNodeDelay(
  edge: WorkspaceOntologyProjectedEdge,
  nodeDelays: ReadonlyMap<string, number>
) {
  if (edge.kind === "hierarchy") {
    return nodeDelays.get(edge.target) ?? nodeDelays.get(edge.source) ?? 0
  }
  return Math.max(
    nodeDelays.get(edge.source) ?? 0,
    nodeDelays.get(edge.target) ?? 0
  )
}

function buildEdgeDelays({
  previousEdges,
  nextEdges,
  edgePhases,
  nodeDelays,
}: Pick<TransitionWaveInput, "previousEdges" | "nextEdges" | "edgePhases"> & {
  nodeDelays: ReadonlyMap<string, number>
}) {
  const delays = new Map<string, number>()
  nextEdges.forEach((edge) => {
    if (edgePhases.get(edge.id) !== "entering") return
    delays.set(
      edge.id,
      Math.max(
        0,
        resolveConnectedNodeDelay(edge, nodeDelays) - WAVE_NODE_LEAD_MS
      )
    )
  })
  previousEdges.forEach((edge) => {
    if (edgePhases.get(edge.id) !== "exiting") return
    delays.set(
      edge.id,
      resolveConnectedNodeDelay(edge, nodeDelays) + WAVE_EDGE_LAG_MS
    )
  })
  return delays
}

function resolveTransitionDuration({
  phases,
  delays,
  enteringDuration,
  exitingDuration,
}: {
  phases: ReadonlyMap<string, WorkspaceOntologyTransitionPhase>
  delays: ReadonlyMap<string, number>
  enteringDuration: number
  exitingDuration: number
}) {
  return Array.from(phases, ([id, phase]) => {
    if (phase === "stable") return WORKSPACE_ONTOLOGY_LAYOUT_MOVE_MS
    const duration = phase === "entering" ? enteringDuration : exitingDuration
    return (delays.get(id) ?? 0) + duration
  }).reduce((longest, duration) => Math.max(longest, duration), 0)
}

export function buildWorkspaceOntologyTransitionWave(
  input: TransitionWaveInput
) {
  const nodeDelays = buildNodeDelays(input)
  const edgeDelays = buildEdgeDelays({ ...input, nodeDelays })
  const nodeDuration = resolveTransitionDuration({
    phases: input.nodePhases,
    delays: nodeDelays,
    enteringDuration: WORKSPACE_ONTOLOGY_NODE_ENTER_MS,
    exitingDuration: WORKSPACE_ONTOLOGY_NODE_EXIT_MS,
  })
  const edgeDuration = resolveTransitionDuration({
    phases: input.edgePhases,
    delays: edgeDelays,
    enteringDuration: WORKSPACE_ONTOLOGY_EDGE_ENTER_MS,
    exitingDuration: WORKSPACE_ONTOLOGY_EDGE_EXIT_MS,
  })

  return {
    nodeDelays,
    edgeDelays,
    duration: Math.max(
      WORKSPACE_ONTOLOGY_LAYOUT_MOVE_MS,
      nodeDuration,
      edgeDuration
    ),
  }
}
