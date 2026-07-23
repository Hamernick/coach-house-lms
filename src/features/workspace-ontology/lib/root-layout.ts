import {
  WORKSPACE_ONTOLOGY_ROOT_IDS,
  type WorkspaceOntologyObstacle,
  type WorkspaceOntologyPosition,
  type WorkspaceOntologyProjection,
  type WorkspaceOntologyRootGeometry,
  type WorkspaceOntologyRootId,
} from "../types"
import { resolveWorkspaceOntologyNodeSize } from "./node-size"
import { buildWrappedBranchPositions } from "./wrapped-layout"

const BRANCH_SCENE_GAP = 96
const BRANCH_LANE_WIDTH = 4_800
const MAX_LAYOUT_ATTEMPTS = 160

type RootGeometryMap = Partial<
  Record<WorkspaceOntologyRootId, WorkspaceOntologyRootGeometry>
>

type BranchScene = {
  rootId: WorkspaceOntologyRootId
  root: WorkspaceOntologyRootGeometry
  width: number
  height: number
  rootOffset: WorkspaceOntologyPosition
  preferredPosition: WorkspaceOntologyPosition
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

function buildBranchScene({
  projection,
  rootId,
  root,
}: {
  projection: WorkspaceOntologyProjection
  rootId: WorkspaceOntologyRootId
  root: WorkspaceOntologyRootGeometry
}): BranchScene | null {
  const branchNodes = projection.nodes.filter((node) => node.rootId === rootId)
  if (branchNodes.length === 0) return null

  const positions = buildWrappedBranchPositions({ projection, rootId, root })
  let left = Number.POSITIVE_INFINITY
  let top = Number.POSITIVE_INFINITY
  let right = Number.NEGATIVE_INFINITY
  let bottom = Number.NEGATIVE_INFINITY

  for (const node of branchNodes) {
    const position = positions.get(node.id)
    if (!position) continue
    const size = resolveWorkspaceOntologyNodeSize(node)
    left = Math.min(left, position.x)
    top = Math.min(top, position.y)
    right = Math.max(right, position.x + size.width)
    bottom = Math.max(bottom, position.y + size.height)
  }

  if (![left, top, right, bottom].every(Number.isFinite)) return null
  return {
    rootId,
    root,
    width: Math.ceil(right - left),
    height: Math.ceil(bottom - top),
    rootOffset: {
      x: Math.round(root.x - left),
      y: Math.round(root.y - top),
    },
    preferredPosition: { x: Math.round(left), y: Math.round(top) },
  }
}

function sceneRectangle(
  scene: BranchScene,
  position: WorkspaceOntologyPosition
): WorkspaceOntologyRootGeometry {
  return { ...position, width: scene.width, height: scene.height }
}

function findAvailableBranchPosition({
  scene,
  occupied,
}: {
  scene: BranchScene
  occupied: WorkspaceOntologyObstacle[]
}) {
  const rowLeft = scene.preferredPosition.x
  const rowRight = rowLeft + BRANCH_LANE_WIDTH
  let candidate = { ...scene.preferredPosition }

  for (let attempt = 0; attempt < MAX_LAYOUT_ATTEMPTS; attempt += 1) {
    const overlap = occupied
      .filter((entry) =>
        rectanglesOverlap(
          sceneRectangle(scene, candidate),
          entry,
          BRANCH_SCENE_GAP
        )
      )
      .sort(
        (left, right) =>
          left.y - right.y || left.x - right.x || left.width - right.width
      )[0]
    if (!overlap) return candidate

    const nextX = overlap.x + overlap.width + BRANCH_SCENE_GAP
    if (nextX + scene.width <= rowRight) {
      candidate = { x: nextX, y: candidate.y }
      continue
    }
    candidate = {
      x: rowLeft,
      y: Math.max(
        candidate.y + scene.height + BRANCH_SCENE_GAP,
        overlap.y + overlap.height + BRANCH_SCENE_GAP
      ),
    }
  }
  return candidate
}

export function arrangeWorkspaceOntologyBranchGeometry({
  projection,
  rootGeometry,
  obstacles,
}: {
  projection: WorkspaceOntologyProjection
  rootGeometry: RootGeometryMap
  obstacles: WorkspaceOntologyObstacle[]
}) {
  const scenes = WORKSPACE_ONTOLOGY_ROOT_IDS.flatMap((rootId) => {
    const root = rootGeometry[rootId]
    const scene = root ? buildBranchScene({ projection, rootId, root }) : null
    return scene ? [scene] : []
  }).sort(
    (left, right) =>
      left.root.y - right.root.y ||
      left.root.x - right.root.x ||
      left.rootId.localeCompare(right.rootId)
  )
  const occupied = obstacles.map((obstacle) => ({ ...obstacle }))
  const layoutGeometry: RootGeometryMap = { ...rootGeometry }

  for (const scene of scenes) {
    const position = findAvailableBranchPosition({ scene, occupied })
    layoutGeometry[scene.rootId] = {
      ...scene.root,
      x: Math.round(position.x + scene.rootOffset.x),
      y: Math.round(position.y + scene.rootOffset.y),
    }
    occupied.push({
      id: `workspace-ontology-branch:${scene.rootId}`,
      ...sceneRectangle(scene, position),
    })
  }

  return layoutGeometry
}
