import {
  WORKSPACE_CANVAS_PERSON_NODE_SIZE,
  type WorkspaceCanvasPersonPlacement,
} from "./workspace-canvas-person-node-model"
import {
  WORKSPACE_PERSON_RELATIONSHIP_LEVEL_GAP,
  WORKSPACE_PERSON_RELATIONSHIP_ROOT_GAP,
  WORKSPACE_PERSON_RELATIONSHIP_SIBLING_GAP,
  type WorkspaceCanvasPoint,
} from "./workspace-canvas-person-relationship-layout-constants"

function placementFromCenter(personId: string, center: WorkspaceCanvasPoint) {
  return {
    personId,
    x: Math.round(center.x - WORKSPACE_CANVAS_PERSON_NODE_SIZE.width / 2),
    y: Math.round(center.y - WORKSPACE_CANVAS_PERSON_NODE_SIZE.height / 2),
  }
}

function resolveRelationshipChildrenSpan({
  childIds,
  subtreeWidthByPersonId,
  gap,
}: {
  childIds: string[]
  subtreeWidthByPersonId: ReadonlyMap<string, number>
  gap: number
}) {
  if (childIds.length === 0) return 0

  return childIds.reduce(
    (span, childId, index) =>
      span +
      (subtreeWidthByPersonId.get(childId) ??
        WORKSPACE_CANVAS_PERSON_NODE_SIZE.width) +
      (index === childIds.length - 1 ? 0 : gap),
    0
  )
}

function resolveRelationshipSubtreeWidth({
  personId,
  childrenByParentId,
  subtreeWidthByPersonId,
  activePersonIds,
}: {
  personId: string
  childrenByParentId: ReadonlyMap<string, string[]>
  subtreeWidthByPersonId: Map<string, number>
  activePersonIds: Set<string>
}) {
  const cachedWidth = subtreeWidthByPersonId.get(personId)
  if (cachedWidth !== undefined) return cachedWidth
  if (activePersonIds.has(personId)) {
    return WORKSPACE_CANVAS_PERSON_NODE_SIZE.width
  }

  activePersonIds.add(personId)
  const childIds = childrenByParentId.get(personId) ?? []
  const childWidths = childIds.map((childId) =>
    resolveRelationshipSubtreeWidth({
      personId: childId,
      childrenByParentId,
      subtreeWidthByPersonId,
      activePersonIds,
    })
  )
  activePersonIds.delete(personId)

  const childrenSpan =
    childWidths.reduce((total, width) => total + width, 0) +
    Math.max(0, childWidths.length - 1) *
      WORKSPACE_PERSON_RELATIONSHIP_SIBLING_GAP
  const width = Math.max(WORKSPACE_CANVAS_PERSON_NODE_SIZE.width, childrenSpan)

  subtreeWidthByPersonId.set(personId, width)
  return width
}

function placeRelationshipSubtree({
  personId,
  center,
  subtreeLeftX,
  level,
  selectedIdSet,
  childrenByParentId,
  subtreeWidthByPersonId,
  placements,
  activePersonIds,
}: {
  personId: string
  center: WorkspaceCanvasPoint
  subtreeLeftX: number
  level: number
  selectedIdSet: ReadonlySet<string>
  childrenByParentId: ReadonlyMap<string, string[]>
  subtreeWidthByPersonId: ReadonlyMap<string, number>
  placements: WorkspaceCanvasPersonPlacement[]
  activePersonIds: Set<string>
}) {
  if (activePersonIds.has(personId)) return

  activePersonIds.add(personId)
  const subtreeWidth =
    subtreeWidthByPersonId.get(personId) ??
    WORKSPACE_CANVAS_PERSON_NODE_SIZE.width
  const nodeCenter = {
    x: subtreeLeftX + subtreeWidth / 2,
    y: center.y + level * WORKSPACE_PERSON_RELATIONSHIP_LEVEL_GAP,
  }

  if (selectedIdSet.has(personId)) {
    placements.push(placementFromCenter(personId, nodeCenter))
  }

  const childIds = childrenByParentId.get(personId) ?? []
  const childSpan = resolveRelationshipChildrenSpan({
    childIds,
    subtreeWidthByPersonId,
    gap: WORKSPACE_PERSON_RELATIONSHIP_SIBLING_GAP,
  })
  let childLeftX = nodeCenter.x - childSpan / 2

  for (const childId of childIds) {
    const childWidth =
      subtreeWidthByPersonId.get(childId) ??
      WORKSPACE_CANVAS_PERSON_NODE_SIZE.width
    placeRelationshipSubtree({
      personId: childId,
      center,
      subtreeLeftX: childLeftX,
      level: level + 1,
      selectedIdSet,
      childrenByParentId,
      subtreeWidthByPersonId,
      placements,
      activePersonIds,
    })
    childLeftX += childWidth + WORKSPACE_PERSON_RELATIONSHIP_SIBLING_GAP
  }

  activePersonIds.delete(personId)
}

function resolveRelationshipRootSpan({
  rootIds,
  subtreeWidthByPersonId,
}: {
  rootIds: string[]
  subtreeWidthByPersonId: ReadonlyMap<string, number>
}) {
  return rootIds.reduce(
    (span, rootId, index) =>
      span +
      (subtreeWidthByPersonId.get(rootId) ??
        WORKSPACE_CANVAS_PERSON_NODE_SIZE.width) +
      (index === rootIds.length - 1
        ? 0
        : WORKSPACE_PERSON_RELATIONSHIP_ROOT_GAP),
    0
  )
}

function resolveRelationshipSubtreeWidths({
  rootIds,
  childrenByParentId,
}: {
  rootIds: string[]
  childrenByParentId: ReadonlyMap<string, string[]>
}) {
  const subtreeWidthByPersonId = new Map<string, number>()

  for (const rootId of rootIds) {
    resolveRelationshipSubtreeWidth({
      personId: rootId,
      childrenByParentId,
      subtreeWidthByPersonId,
      activePersonIds: new Set(),
    })
  }

  return subtreeWidthByPersonId
}

export function buildRelationshipTreePlacements({
  rootIds,
  selectedIdSet,
  childrenByParentId,
  center,
}: {
  rootIds: string[]
  selectedIdSet: ReadonlySet<string>
  childrenByParentId: ReadonlyMap<string, string[]>
  center: WorkspaceCanvasPoint
}) {
  const subtreeWidthByPersonId = resolveRelationshipSubtreeWidths({
    rootIds,
    childrenByParentId,
  })
  const rootSpan = resolveRelationshipRootSpan({
    rootIds,
    subtreeWidthByPersonId,
  })
  const placements: WorkspaceCanvasPersonPlacement[] = []
  let rootLeftX = center.x - rootSpan / 2

  for (const rootId of rootIds) {
    const rootWidth =
      subtreeWidthByPersonId.get(rootId) ??
      WORKSPACE_CANVAS_PERSON_NODE_SIZE.width
    placeRelationshipSubtree({
      personId: rootId,
      center,
      subtreeLeftX: rootLeftX,
      level: 0,
      selectedIdSet,
      childrenByParentId,
      subtreeWidthByPersonId,
      placements,
      activePersonIds: new Set(),
    })
    rootLeftX += rootWidth + WORKSPACE_PERSON_RELATIONSHIP_ROOT_GAP
  }

  return placements
}
