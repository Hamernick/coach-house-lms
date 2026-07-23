import type {
  WorkspaceOntologyFilter,
  WorkspaceOntologyInput,
  WorkspaceOntologyNodeInput,
  WorkspaceOntologyProjectedEdge,
  WorkspaceOntologyProjectedNode,
  WorkspaceOntologyProjection,
  WorkspaceOntologyRootId,
  WorkspaceOntologyState,
} from "../types"

type FlattenedOntology = {
  nodes: WorkspaceOntologyProjectedNode[]
  nodeById: Map<string, WorkspaceOntologyProjectedNode>
  ancestorIdsByNodeId: Map<string, string[]>
  reservedRootIds: Set<string>
}

const STATUS_PRIORITY = {
  blocked: 0,
  missing: 1,
  "in-progress": 2,
  complete: 3,
} as const

function sortNodesByPriority(nodes: WorkspaceOntologyNodeInput[]) {
  return nodes
    .map((node, index) => ({ node, index }))
    .sort(
      (left, right) =>
        STATUS_PRIORITY[left.node.status] -
          STATUS_PRIORITY[right.node.status] || left.index - right.index
    )
    .map(({ node }) => node)
}

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase()
}

function flattenNode({
  node,
  rootId,
  parentId,
  depth,
  ancestors,
  output,
}: {
  node: WorkspaceOntologyNodeInput
  rootId: WorkspaceOntologyRootId
  parentId: string
  depth: number
  ancestors: string[]
  output: FlattenedOntology
}) {
  if (output.reservedRootIds.has(node.id) || output.nodeById.has(node.id)) {
    return
  }
  const children = sortNodesByPriority(node.children ?? [])
  const projected: WorkspaceOntologyProjectedNode = {
    id: node.id,
    label: node.label,
    description: node.description,
    category: node.category,
    kind: node.kind,
    status: node.status,
    statusLabel: node.statusLabel,
    relationshipLabel: node.relationshipLabel,
    href: node.href,
    actionLabel: node.actionLabel,
    actionTarget: node.actionTarget,
    focusRoot: node.focusRoot,
    ownerLabel: node.ownerLabel,
    keywords: node.keywords,
    rootId,
    parentId,
    depth,
    childCount: children.length,
    hasChildren: children.length > 0,
  }
  output.nodes.push(projected)
  output.nodeById.set(projected.id, projected)
  output.ancestorIdsByNodeId.set(projected.id, ancestors)
  for (const child of children) {
    flattenNode({
      node: child,
      rootId,
      parentId: node.id,
      depth: depth + 1,
      ancestors: [...ancestors, node.id],
      output,
    })
  }
}

function flattenOntology(input: WorkspaceOntologyInput): FlattenedOntology {
  const output: FlattenedOntology = {
    nodes: [],
    nodeById: new Map(),
    ancestorIdsByNodeId: new Map(),
    reservedRootIds: new Set(input.roots.map((root) => root.id)),
  }
  for (const root of input.roots) {
    for (const node of sortNodesByPriority(root.children)) {
      flattenNode({
        node,
        rootId: root.id,
        parentId: root.id,
        depth: 1,
        ancestors: [],
        output,
      })
    }
  }
  return output
}

function nodeMatchesQuery(node: WorkspaceOntologyProjectedNode, query: string) {
  if (!query) return true
  const haystack = [
    node.label,
    node.description,
    node.category,
    node.status,
    node.statusLabel,
    node.kind,
    node.ownerLabel ?? "",
    ...(node.keywords ?? []),
  ]
    .join(" ")
    .toLocaleLowerCase()
  return haystack.includes(query)
}

export function searchWorkspaceOntologyNodes({
  nodes,
  query,
}: {
  nodes: WorkspaceOntologyProjectedNode[]
  query: string
}) {
  const normalizedQuery = normalizeSearchValue(query)
  if (!normalizedQuery) return nodes
  return nodes.filter((node) => nodeMatchesQuery(node, normalizedQuery))
}

function buildQueryVisibility({
  flattened,
  query,
}: {
  flattened: FlattenedOntology
  query: string
}) {
  const visibleIds = new Set<string>()
  const resultIds: string[] = []
  if (!query) return { visibleIds, resultIds }

  for (const node of flattened.nodes) {
    if (!nodeMatchesQuery(node, query)) continue
    visibleIds.add(node.id)
    resultIds.push(node.id)
    for (const ancestorId of flattened.ancestorIdsByNodeId.get(node.id) ?? []) {
      visibleIds.add(ancestorId)
    }
  }
  return { visibleIds, resultIds }
}

function buildCategoryVisibility({
  flattened,
  categories,
}: {
  flattened: FlattenedOntology
  categories: ReadonlySet<WorkspaceOntologyProjectedNode["category"]>
}) {
  const visibleIds = new Set<string>()
  if (categories.size === 0) return visibleIds
  for (const node of flattened.nodes) {
    if (!categories.has(node.category)) continue
    visibleIds.add(node.id)
    for (const ancestorId of flattened.ancestorIdsByNodeId.get(node.id) ?? []) {
      visibleIds.add(ancestorId)
    }
  }
  return visibleIds
}

function isNodeVisibleThroughExpansion(
  node: WorkspaceOntologyProjectedNode,
  state: WorkspaceOntologyState,
  ancestorIds: string[]
) {
  if (!state.expandedRootIds.includes(node.rootId)) return false
  return ancestorIds.every((ancestorId) =>
    state.expandedNodeIds.includes(ancestorId)
  )
}

export function buildWorkspaceOntologyProjection({
  input,
  state,
  filter,
}: {
  input: WorkspaceOntologyInput
  state: WorkspaceOntologyState
  filter: WorkspaceOntologyFilter
}): WorkspaceOntologyProjection {
  const flattened = flattenOntology(input)
  const query = normalizeSearchValue(filter.query)
  const activeCategorySet = new Set(filter.categories)
  const { visibleIds: queryVisibleIds, resultIds } = buildQueryVisibility({
    flattened,
    query,
  })
  const categoryVisibleIds = buildCategoryVisibility({
    flattened,
    categories: activeCategorySet,
  })
  const nodes = flattened.nodes.filter((node) => {
    const visibleThroughExpansion = isNodeVisibleThroughExpansion(
      node,
      state,
      flattened.ancestorIdsByNodeId.get(node.id) ?? []
    )
    const visibleThroughSearch = query ? queryVisibleIds.has(node.id) : false
    if (!visibleThroughExpansion && !visibleThroughSearch) return false
    if (
      activeCategorySet.size > 0 &&
      !categoryVisibleIds.has(node.id) &&
      !visibleThroughSearch
    ) {
      return false
    }
    return true
  })
  const visibleIdSet = new Set(nodes.map((node) => node.id))
  const edges: WorkspaceOntologyProjectedEdge[] = []
  const edgeIds = new Set<string>()
  const edgeTuples = new Set<string>()
  const labeledHierarchySources = new Set<string>()
  for (const node of nodes) {
    if (node.parentId !== node.rootId && !visibleIdSet.has(node.parentId)) {
      continue
    }
    const edge = {
      id: `ontology-edge:${node.parentId}:${node.id}`,
      source: node.parentId,
      target: node.id,
      label: node.relationshipLabel,
      category: node.category,
      status: node.status,
      kind: "hierarchy",
      showLabel: !labeledHierarchySources.has(node.parentId),
    } as const
    const tuple = `${edge.source}:${edge.target}:${edge.kind}`
    if (edgeIds.has(edge.id) || edgeTuples.has(tuple)) continue
    edgeIds.add(edge.id)
    edgeTuples.add(tuple)
    labeledHierarchySources.add(node.parentId)
    edges.push(edge)
  }
  for (const relationship of input.relationships ?? []) {
    const sourceVisible = visibleIdSet.has(relationship.source)
    const targetVisible =
      visibleIdSet.has(relationship.target) ||
      relationship.target.startsWith("workspace-person:")
    if (
      !sourceVisible ||
      !targetVisible ||
      relationship.source === relationship.target
    ) {
      continue
    }
    const tuple = `${relationship.source}:${relationship.target}:relationship`
    if (edgeIds.has(relationship.id) || edgeTuples.has(tuple)) continue
    edgeIds.add(relationship.id)
    edgeTuples.add(tuple)
    edges.push({ ...relationship, kind: "relationship", showLabel: true })
  }
  return {
    nodes,
    edges,
    allNodes: flattened.nodes,
    resultNodeIds: resultIds,
  }
}

export function buildWorkspaceOntologyRootDescendantCounts(
  input: WorkspaceOntologyInput
) {
  const counts = new Map<WorkspaceOntologyRootId, number>()
  const flattened = flattenOntology(input)
  for (const root of input.roots) {
    counts.set(
      root.id,
      flattened.nodes.filter((node) => node.rootId === root.id).length
    )
  }
  return counts
}

export function buildWorkspaceOntologyRootAttentionCounts(
  input: WorkspaceOntologyInput
) {
  const counts = new Map<WorkspaceOntologyRootId, number>()
  const flattened = flattenOntology(input)
  for (const root of input.roots) {
    counts.set(
      root.id,
      flattened.nodes.filter(
        (node) =>
          node.rootId === root.id &&
          (node.status === "blocked" || node.status === "missing")
      ).length
    )
  }
  return counts
}

export function buildWorkspaceOntologyRootCompletedCounts(
  input: WorkspaceOntologyInput
) {
  const counts = new Map<WorkspaceOntologyRootId, number>()
  const flattened = flattenOntology(input)
  for (const root of input.roots) {
    counts.set(
      root.id,
      flattened.nodes.filter(
        (node) => node.rootId === root.id && node.status === "complete"
      ).length
    )
  }
  return counts
}

export function buildWorkspaceOntologyAncestorIdsByNodeId(
  input: WorkspaceOntologyInput
) {
  return flattenOntology(input).ancestorIdsByNodeId
}
