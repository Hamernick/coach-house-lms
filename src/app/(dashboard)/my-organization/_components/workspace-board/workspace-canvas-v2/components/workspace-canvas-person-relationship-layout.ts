import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"

import {
  buildWorkspaceCanvasPersonManagerByPersonId,
  normalizeWorkspaceCanvasPersonIds,
} from "./workspace-canvas-person-relationship-engine"
import { type WorkspaceCanvasPersonPlacement } from "./workspace-canvas-person-node-model"
import {
  buildRelationshipLevelGridPlacements,
  relationshipGraphIsTooWideForTreeLayout,
} from "./workspace-canvas-person-relationship-level-grid"
import { type WorkspaceCanvasPoint } from "./workspace-canvas-person-relationship-layout-constants"
import { buildRelationshipTreePlacements } from "./workspace-canvas-person-relationship-tree-layout"

export {
  resolveWorkspacePeopleRelationshipCanvasCenter,
  resolveWorkspacePeopleRelationshipRingRadius,
  shiftWorkspacePeopleRelationshipPlacementsAwayFromWorkspaceCards,
} from "./workspace-canvas-person-relationship-bounds"

function compareFocusCandidate(
  left: { personId: string; reportCount: number; hasManagerInGraph: boolean },
  right: { personId: string; reportCount: number; hasManagerInGraph: boolean }
) {
  if (left.hasManagerInGraph !== right.hasManagerInGraph) {
    return left.hasManagerInGraph ? 1 : -1
  }

  if (left.reportCount !== right.reportCount) {
    return right.reportCount - left.reportCount
  }

  return left.personId.localeCompare(right.personId)
}

function candidateHasManagerInRelationshipGraph({
  personId,
  relationshipGraphPersonIds,
  managerByPersonId,
}: {
  personId: string
  relationshipGraphPersonIds: ReadonlySet<string>
  managerByPersonId: ReadonlyMap<string, string>
}) {
  const reportsToId = managerByPersonId.get(personId)
  return Boolean(reportsToId && relationshipGraphPersonIds.has(reportsToId))
}

export function resolveWorkspacePeopleRelationshipFocusPersonId({
  personIds,
  peopleById,
  existingPlacements,
}: {
  personIds: string[]
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
  existingPlacements: WorkspaceCanvasPersonPlacement[]
}) {
  const selectedIds = normalizeWorkspaceCanvasPersonIds(personIds).filter(
    (personId) => peopleById.has(personId)
  )
  if (selectedIds.length === 0) return null

  const selectedIdSet = new Set(selectedIds)
  const existingPlacementIds = new Set(
    existingPlacements.map((placement) => placement.personId)
  )
  const relationshipGraphPersonIds = new Set([
    ...selectedIdSet,
    ...existingPlacementIds,
  ])
  const managerByPersonId = buildWorkspaceCanvasPersonManagerByPersonId({
    personIds: Array.from(relationshipGraphPersonIds),
    peopleById,
  })
  const candidateCounts = new Map<string, number>()

  for (const personId of selectedIds) {
    const reportsToId = managerByPersonId.get(personId)
    if (!reportsToId) continue
    if (!peopleById.has(reportsToId)) continue
    if (
      !selectedIdSet.has(reportsToId) &&
      !existingPlacementIds.has(reportsToId)
    ) {
      continue
    }

    candidateCounts.set(
      reportsToId,
      (candidateCounts.get(reportsToId) ?? 0) + 1
    )
  }

  const candidates = Array.from(candidateCounts.entries())
    .map(([personId, reportCount]) => ({
      personId,
      reportCount,
      hasManagerInGraph: candidateHasManagerInRelationshipGraph({
        personId,
        relationshipGraphPersonIds,
        managerByPersonId,
      }),
    }))
    .sort(compareFocusCandidate)

  return candidates[0]?.personId ?? null
}

function compareRelationshipPersonIdsByName({
  leftPersonId,
  rightPersonId,
  peopleById,
}: {
  leftPersonId: string
  rightPersonId: string
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
}) {
  const leftPerson = peopleById.get(leftPersonId)
  const rightPerson = peopleById.get(rightPersonId)
  return (leftPerson?.name ?? leftPersonId).localeCompare(
    rightPerson?.name ?? rightPersonId
  )
}

function buildRelationshipChildrenByParentId({
  selectedIds,
  peopleById,
  relationshipGraphPersonIds,
  managerByPersonId,
}: {
  selectedIds: string[]
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
  relationshipGraphPersonIds: ReadonlySet<string>
  managerByPersonId: ReadonlyMap<string, string>
}) {
  const childrenByParentId = new Map<string, string[]>()

  for (const childPersonId of selectedIds) {
    const parentPersonId = managerByPersonId.get(childPersonId)
    if (!parentPersonId || !relationshipGraphPersonIds.has(parentPersonId)) {
      continue
    }

    const children = childrenByParentId.get(parentPersonId)
    if (children) children.push(childPersonId)
    else childrenByParentId.set(parentPersonId, [childPersonId])
  }

  for (const children of childrenByParentId.values()) {
    children.sort((leftPersonId, rightPersonId) =>
      compareRelationshipPersonIdsByName({
        leftPersonId,
        rightPersonId,
        peopleById,
      })
    )
  }

  return childrenByParentId
}

function personHasAncestorInRelationshipGraph({
  personId,
  ancestorPersonId,
  relationshipGraphPersonIds,
  managerByPersonId,
}: {
  personId: string
  ancestorPersonId: string
  relationshipGraphPersonIds: ReadonlySet<string>
  managerByPersonId: ReadonlyMap<string, string>
}) {
  let currentPersonId = personId
  const visitedPersonIds = new Set([personId])

  for (let depth = 0; depth <= relationshipGraphPersonIds.size; depth += 1) {
    const parentPersonId = managerByPersonId.get(currentPersonId)
    if (!parentPersonId) return false
    if (parentPersonId === ancestorPersonId) return true
    if (!relationshipGraphPersonIds.has(parentPersonId)) return false
    if (visitedPersonIds.has(parentPersonId)) return false

    visitedPersonIds.add(parentPersonId)
    currentPersonId = parentPersonId
  }

  return false
}

function resolveRelationshipRootPersonIds({
  selectedIds,
  focusPersonId,
  peopleById,
  relationshipGraphPersonIds,
  managerByPersonId,
}: {
  selectedIds: string[]
  focusPersonId: string | null
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
  relationshipGraphPersonIds: ReadonlySet<string>
  managerByPersonId: ReadonlyMap<string, string>
}) {
  const rootIds: string[] = []
  if (focusPersonId && relationshipGraphPersonIds.has(focusPersonId)) {
    rootIds.push(focusPersonId)
  }

  for (const personId of selectedIds) {
    if (personId === focusPersonId) continue
    if (
      focusPersonId &&
      personHasAncestorInRelationshipGraph({
        personId,
        ancestorPersonId: focusPersonId,
        relationshipGraphPersonIds,
        managerByPersonId,
      })
    ) {
      continue
    }

    const parentPersonId = managerByPersonId.get(personId)
    if (parentPersonId && relationshipGraphPersonIds.has(parentPersonId)) {
      continue
    }

    rootIds.push(personId)
  }

  if (!focusPersonId) {
    return rootIds.sort((leftPersonId, rightPersonId) =>
      compareRelationshipPersonIdsByName({
        leftPersonId,
        rightPersonId,
        peopleById,
      })
    )
  }

  const [focusRoot, ...otherRoots] = rootIds
  const sortedRoots = otherRoots.sort((leftPersonId, rightPersonId) =>
    compareRelationshipPersonIdsByName({
      leftPersonId,
      rightPersonId,
      peopleById,
    })
  )

  return focusRoot ? [focusRoot, ...sortedRoots] : sortedRoots
}

export function buildWorkspacePeopleRelationshipPlacementLayout({
  personIds,
  peopleById,
  existingPlacements,
  center,
}: {
  personIds: string[]
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
  existingPlacements: WorkspaceCanvasPersonPlacement[]
  center: WorkspaceCanvasPoint
}): WorkspaceCanvasPersonPlacement[] {
  const selectedIds = normalizeWorkspaceCanvasPersonIds(personIds).filter(
    (personId) => peopleById.has(personId)
  )
  if (selectedIds.length === 0) return []

  const focusPersonId = resolveWorkspacePeopleRelationshipFocusPersonId({
    personIds: selectedIds,
    peopleById,
    existingPlacements,
  })
  const existingPlacementIds = new Set(
    existingPlacements.map((placement) => placement.personId)
  )
  const selectedIdSet = new Set(selectedIds)
  const relationshipGraphPersonIds = new Set([
    ...selectedIds,
    ...existingPlacementIds,
  ])
  const managerByPersonId = buildWorkspaceCanvasPersonManagerByPersonId({
    personIds: Array.from(relationshipGraphPersonIds),
    peopleById,
  })
  const childrenByParentId = buildRelationshipChildrenByParentId({
    selectedIds,
    peopleById,
    relationshipGraphPersonIds,
    managerByPersonId,
  })
  const rootIds = resolveRelationshipRootPersonIds({
    selectedIds,
    focusPersonId,
    peopleById,
    relationshipGraphPersonIds,
    managerByPersonId,
  })
  if (rootIds.length === 0) return []

  if (
    relationshipGraphIsTooWideForTreeLayout({
      rootIds,
      selectedIdSet,
      childrenByParentId,
    })
  ) {
    return buildRelationshipLevelGridPlacements({
      rootIds,
      selectedIdSet,
      childrenByParentId,
      managerByPersonId,
      peopleById,
      center,
    })
  }

  return buildRelationshipTreePlacements({
    rootIds,
    selectedIdSet,
    childrenByParentId,
    center,
  })
}
