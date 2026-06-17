import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"

import {
  WORKSPACE_CANVAS_PERSON_NODE_SIZE,
  type WorkspaceCanvasPersonPlacement,
} from "./workspace-canvas-person-node-model"
import {
  WORKSPACE_PERSON_RELATIONSHIP_GRID_THRESHOLD,
  WORKSPACE_PERSON_RELATIONSHIP_LEVEL_GAP,
  WORKSPACE_PERSON_RELATIONSHIP_MAX_LEVEL_COLUMNS,
  WORKSPACE_PERSON_RELATIONSHIP_MAX_ROOT_COLUMNS,
  WORKSPACE_PERSON_RELATIONSHIP_SIBLING_GAP,
  type WorkspaceCanvasPoint,
} from "./workspace-canvas-person-relationship-layout-constants"

type WorkspaceRelationshipPersonCategory = OrgPersonWithImage["category"]

const WORKSPACE_RELATIONSHIP_CATEGORY_RANK = new Map<
  WorkspaceRelationshipPersonCategory,
  number
>([
  ["governing_board", 0],
  ["advisory_board", 1],
  ["staff", 2],
  ["contractors", 3],
  ["vendors", 4],
  ["volunteers", 5],
  ["supporters", 6],
])

function placementFromCenter(personId: string, center: WorkspaceCanvasPoint) {
  return {
    personId,
    x: Math.round(center.x - WORKSPACE_CANVAS_PERSON_NODE_SIZE.width / 2),
    y: Math.round(center.y - WORKSPACE_CANVAS_PERSON_NODE_SIZE.height / 2),
  }
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

function chunkRelationshipPersonIds(personIds: string[], maxSize: number) {
  const chunks: string[][] = []
  for (let index = 0; index < personIds.length; index += maxSize) {
    chunks.push(personIds.slice(index, index + maxSize))
  }
  return chunks
}

function resolveRelationshipCategoryRank(
  category: WorkspaceRelationshipPersonCategory | undefined
) {
  return category ? WORKSPACE_RELATIONSHIP_CATEGORY_RANK.get(category) ?? 99 : 99
}

function resolveRelationshipCategoryGroupRank(
  category: WorkspaceRelationshipPersonCategory | undefined
) {
  if (isBoardCategory(category)) return 0
  if (category === "staff") return 2
  if (isPartnerCategory(category)) return 3
  if (isSupportCategory(category)) return 4

  return resolveRelationshipCategoryRank(category)
}

function isBoardCategory(
  category: WorkspaceRelationshipPersonCategory | undefined
) {
  return category === "governing_board" || category === "advisory_board"
}

function isSupportCategory(
  category: WorkspaceRelationshipPersonCategory | undefined
) {
  return category === "volunteers" || category === "supporters"
}

function isPartnerCategory(
  category: WorkspaceRelationshipPersonCategory | undefined
) {
  return category === "contractors" || category === "vendors"
}

export function relationshipGraphIsTooWideForTreeLayout({
  rootIds,
  selectedIdSet,
  childrenByParentId,
}: {
  rootIds: string[]
  selectedIdSet: ReadonlySet<string>
  childrenByParentId: ReadonlyMap<string, string[]>
}) {
  if (rootIds.length > WORKSPACE_PERSON_RELATIONSHIP_MAX_ROOT_COLUMNS) {
    return true
  }
  if (selectedIdSet.size >= WORKSPACE_PERSON_RELATIONSHIP_GRID_THRESHOLD) {
    return true
  }

  for (const childIds of childrenByParentId.values()) {
    if (childIds.length > WORKSPACE_PERSON_RELATIONSHIP_MAX_LEVEL_COLUMNS) {
      return true
    }
  }

  return false
}

function resolveRelationshipLevelByPersonId({
  rootIds,
  selectedIdSet,
  childrenByParentId,
}: {
  rootIds: string[]
  selectedIdSet: ReadonlySet<string>
  childrenByParentId: ReadonlyMap<string, string[]>
}) {
  const levelByPersonId = new Map<string, number>()
  const queue = rootIds.map((personId) => ({ personId, level: 0 }))

  for (let index = 0; index < queue.length; index += 1) {
    const { personId, level } = queue[index]
    const existingLevel = levelByPersonId.get(personId)
    if (existingLevel !== undefined && existingLevel <= level) continue

    levelByPersonId.set(personId, level)
    for (const childId of childrenByParentId.get(personId) ?? []) {
      queue.push({ personId: childId, level: level + 1 })
    }
  }

  for (const personId of selectedIdSet) {
    if (!levelByPersonId.has(personId)) levelByPersonId.set(personId, 0)
  }

  return levelByPersonId
}

function resolveClusteredVisualLevelByPersonId({
  levelByPersonId,
  selectedIdSet,
  managerByPersonId,
  peopleById,
}: {
  levelByPersonId: ReadonlyMap<string, number>
  selectedIdSet: ReadonlySet<string>
  managerByPersonId: ReadonlyMap<string, string>
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
}) {
  const hasBoardRoot = Array.from(selectedIdSet).some((personId) => {
    const category = peopleById.get(personId)?.category
    return isBoardCategory(category) && !managerByPersonId.has(personId)
  })
  const visualLevelByPersonId = new Map<string, number>()

  for (const personId of selectedIdSet) {
    const person = peopleById.get(personId)
    const baseLevel = levelByPersonId.get(personId) ?? 0
    const hasManager = managerByPersonId.has(personId)
    let visualLevel = baseLevel

    if (!hasManager && isBoardCategory(person?.category)) {
      visualLevel = 0
    } else if (!hasManager && person?.category === "staff" && hasBoardRoot) {
      visualLevel = Math.max(visualLevel, 1)
    } else if (!hasManager && isPartnerCategory(person?.category)) {
      visualLevel = Math.max(visualLevel, hasBoardRoot ? 3 : 2)
    } else if (!hasManager && isSupportCategory(person?.category)) {
      visualLevel = Math.max(visualLevel, hasBoardRoot ? 4 : 3)
    }

    visualLevelByPersonId.set(personId, visualLevel)
  }

  let changed = true
  while (changed) {
    changed = false

    for (const [personId, managerId] of managerByPersonId.entries()) {
      if (!selectedIdSet.has(personId) || !selectedIdSet.has(managerId)) {
        continue
      }

      const managerLevel = visualLevelByPersonId.get(managerId) ?? 0
      const personLevel = visualLevelByPersonId.get(personId) ?? 0
      const nextPersonLevel = Math.max(personLevel, managerLevel + 1)
      if (nextPersonLevel === personLevel) continue

      visualLevelByPersonId.set(personId, nextPersonLevel)
      changed = true
    }
  }

  return visualLevelByPersonId
}

function compareRelationshipPersonIdsByManagerThenName({
  leftPersonId,
  rightPersonId,
  peopleById,
  managerByPersonId,
}: {
  leftPersonId: string
  rightPersonId: string
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
  managerByPersonId: ReadonlyMap<string, string>
}) {
  const leftCategoryRank = resolveRelationshipCategoryRank(
    peopleById.get(leftPersonId)?.category
  )
  const rightCategoryRank = resolveRelationshipCategoryRank(
    peopleById.get(rightPersonId)?.category
  )
  if (leftCategoryRank !== rightCategoryRank) {
    return leftCategoryRank - rightCategoryRank
  }

  const leftManagerId = managerByPersonId.get(leftPersonId) ?? ""
  const rightManagerId = managerByPersonId.get(rightPersonId) ?? ""
  if (leftManagerId !== rightManagerId) {
    return leftManagerId.localeCompare(rightManagerId)
  }

  return compareRelationshipPersonIdsByName({
    leftPersonId,
    rightPersonId,
    peopleById,
  })
}

function groupRelationshipRowsByCategory({
  personIds,
  peopleById,
  maxColumns,
}: {
  personIds: string[]
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
  maxColumns: number
}) {
  const groupedIds = new Map<number, string[]>()

  for (const personId of personIds) {
    const rank = resolveRelationshipCategoryGroupRank(
      peopleById.get(personId)?.category
    )
    const existing = groupedIds.get(rank)
    if (existing) existing.push(personId)
    else groupedIds.set(rank, [personId])
  }

  return Array.from(groupedIds.keys())
    .sort((left, right) => left - right)
    .flatMap((rank) => chunkRelationshipPersonIds(groupedIds.get(rank) ?? [], maxColumns))
}

export function buildRelationshipLevelGridPlacements({
  rootIds,
  selectedIdSet,
  childrenByParentId,
  managerByPersonId,
  peopleById,
  center,
}: {
  rootIds: string[]
  selectedIdSet: ReadonlySet<string>
  childrenByParentId: ReadonlyMap<string, string[]>
  managerByPersonId: ReadonlyMap<string, string>
  peopleById: ReadonlyMap<string, OrgPersonWithImage>
  center: WorkspaceCanvasPoint
}): WorkspaceCanvasPersonPlacement[] {
  const levelByPersonId = resolveRelationshipLevelByPersonId({
    rootIds,
    selectedIdSet,
    childrenByParentId,
  })
  const visualLevelByPersonId = resolveClusteredVisualLevelByPersonId({
    levelByPersonId,
    selectedIdSet,
    managerByPersonId,
    peopleById,
  })
  const levelEntries = Array.from(visualLevelByPersonId.entries())
  const maxLevel = levelEntries.reduce(
    (max, [, level]) => Math.max(max, level),
    0
  )
  const placements: WorkspaceCanvasPersonPlacement[] = []
  let visualRowIndex = 0

  for (let level = 0; level <= maxLevel; level += 1) {
    const levelIds = levelEntries
      .filter(([, itemLevel]) => itemLevel === level)
      .map(([personId]) => personId)
      .sort((leftPersonId, rightPersonId) =>
        compareRelationshipPersonIdsByManagerThenName({
          leftPersonId,
          rightPersonId,
          peopleById,
          managerByPersonId,
        })
      )
    const selectedLevelIds = levelIds.filter((personId) =>
      selectedIdSet.has(personId)
    )
    const maxColumns =
      level === 0
        ? WORKSPACE_PERSON_RELATIONSHIP_MAX_ROOT_COLUMNS
        : WORKSPACE_PERSON_RELATIONSHIP_MAX_LEVEL_COLUMNS
    const rows = groupRelationshipRowsByCategory({
      personIds: selectedLevelIds,
      peopleById,
      maxColumns,
    })

    if (rows.length === 0 && levelIds.length > 0) {
      visualRowIndex += 1
      continue
    }

    for (const rowIds of rows) {
      const rowWidth =
        rowIds.length * WORKSPACE_CANVAS_PERSON_NODE_SIZE.width +
        Math.max(0, rowIds.length - 1) *
          WORKSPACE_PERSON_RELATIONSHIP_SIBLING_GAP
      const rowStartX = center.x - rowWidth / 2
      const rowCenterY =
        center.y + visualRowIndex * WORKSPACE_PERSON_RELATIONSHIP_LEVEL_GAP

      rowIds.forEach((personId, index) => {
        placements.push(
          placementFromCenter(personId, {
            x:
              rowStartX +
              WORKSPACE_CANVAS_PERSON_NODE_SIZE.width / 2 +
              index *
                (WORKSPACE_CANVAS_PERSON_NODE_SIZE.width +
                  WORKSPACE_PERSON_RELATIONSHIP_SIBLING_GAP),
            y: rowCenterY,
          })
        )
      })

      visualRowIndex += 1
    }
  }

  return placements
}
