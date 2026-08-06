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

export const WORKSPACE_ONTOLOGY_FOCUS_ACTION_LIMIT = 3

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
  if (node.visibility === "source-card-only") return
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
    presentation:
      node.presentation ?? (children.length > 0 ? "group" : "action"),
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

function buildChildrenByParentId(nodes: WorkspaceOntologyProjectedNode[]) {
  const childrenByParentId = new Map<string, WorkspaceOntologyProjectedNode[]>()
  for (const node of nodes) {
    childrenByParentId.set(node.parentId, [
      ...(childrenByParentId.get(node.parentId) ?? []),
      node,
    ])
  }
  return childrenByParentId
}

function resolveActiveFocusPath({
  flattened,
  state,
  rootId,
}: {
  flattened: FlattenedOntology
  state: WorkspaceOntologyState
  rootId: WorkspaceOntologyRootId
}) {
  const path: string[] = []
  let expectedParentId: string = rootId
  for (const nodeId of state.expandedNodeIds) {
    const node = flattened.nodeById.get(nodeId)
    if (
      !node ||
      !node.hasChildren ||
      node.rootId !== rootId ||
      node.parentId !== expectedParentId
    ) {
      continue
    }
    path.push(node.id)
    expectedParentId = node.id
  }
  return path
}

function buildSummaryNode({
  children,
  count,
  parentId,
  presentation,
  rootId,
}: {
  children: WorkspaceOntologyProjectedNode[]
  count: number
  parentId: string
  presentation: "rollup" | "more"
  rootId: WorkspaceOntologyRootId
}): WorkspaceOntologyProjectedNode {
  const parentDepth =
    children.length > 0 ? Math.max(0, children[0].depth - 1) : 0
  const category = children[0]?.category ?? "organization"
  const completed = presentation === "rollup"
  return {
    id: `ontology:${presentation}:${parentId}`,
    label: completed
      ? `${count} completed`
      : `${count} more ${count === 1 ? "action" : "actions"}`,
    description: completed
      ? "Completed items are summarized in Focus mode."
      : "Additional items remain available in Map mode.",
    category,
    kind: completed ? "Completion summary" : "Action summary",
    status: completed ? "complete" : "in-progress",
    statusLabel: completed ? "Completed" : "More available",
    relationshipLabel: completed ? "completed" : "continues",
    href: null,
    actionLabel: "Browse in map",
    actionTarget: null,
    focusRoot: false,
    ownerLabel: null,
    keywords: [presentation, "summary"],
    rootId,
    parentId,
    depth: parentDepth + 1,
    childCount: 0,
    hasChildren: false,
    presentation,
  }
}

function selectFocusChildren({
  children,
  parentId,
  preferredChildId,
  rootId,
}: {
  children: WorkspaceOntologyProjectedNode[]
  parentId: string
  preferredChildId?: string
  rootId: WorkspaceOntologyRootId
}) {
  const preferred = preferredChildId
    ? children.find((node) => node.id === preferredChildId)
    : undefined
  const actionable = children.filter((node) => node.status !== "complete")
  const selected: WorkspaceOntologyProjectedNode[] = []
  if (preferred) selected.push(preferred)
  for (const node of actionable) {
    if (
      selected.length >= WORKSPACE_ONTOLOGY_FOCUS_ACTION_LIMIT ||
      selected.some((entry) => entry.id === node.id)
    ) {
      continue
    }
    selected.push(node)
  }

  const selectedIdSet = new Set(selected.map((node) => node.id))
  const hiddenActionCount = actionable.filter(
    (node) => !selectedIdSet.has(node.id)
  ).length
  const completedCount = children.filter(
    (node) => node.status === "complete" && !selectedIdSet.has(node.id)
  ).length
  const summaries: WorkspaceOntologyProjectedNode[] = []
  if (hiddenActionCount > 0) {
    summaries.push(
      buildSummaryNode({
        children,
        count: hiddenActionCount,
        parentId,
        presentation: "more",
        rootId,
      })
    )
  }
  if (completedCount > 0) {
    summaries.push(
      buildSummaryNode({
        children,
        count: completedCount,
        parentId,
        presentation: "rollup",
        rootId,
      })
    )
  }
  return [...selected, ...summaries]
}

function buildFocusListNode({
  children,
  graphParentId,
  parentId,
  parentLabel,
  preferredChildId,
  rootId,
}: {
  children: WorkspaceOntologyProjectedNode[]
  graphParentId: string
  parentId: string
  parentLabel: string
  preferredChildId?: string
  rootId: WorkspaceOntologyRootId
}): WorkspaceOntologyProjectedNode {
  const items = selectFocusChildren({
    children,
    parentId,
    preferredChildId,
    rootId,
  })
  const firstItem = items[0] ?? children[0]
  const primaryItemCount = items.filter(
    (item) => item.presentation === "action" || item.presentation === "group"
  ).length
  return {
    id: `ontology:list:${parentId}`,
    label: parentId === rootId ? "Next steps" : parentLabel,
    description: `A compact list of ${primaryItemCount} prioritized ${primaryItemCount === 1 ? "item" : "items"}.`,
    category: firstItem?.category ?? "organization",
    kind: "Guided action list",
    status: firstItem?.status ?? "in-progress",
    statusLabel: `${primaryItemCount} visible`,
    relationshipLabel: firstItem?.relationshipLabel ?? "includes",
    href: null,
    actionLabel: null,
    actionTarget: null,
    focusRoot: false,
    ownerLabel: null,
    keywords: ["focus", "list", "next steps"],
    rootId,
    parentId: graphParentId,
    listParentId: parentId,
    depth: firstItem?.depth ?? 1,
    childCount: items.length,
    hasChildren: false,
    presentation: "list",
    items,
  }
}

function buildFocusNodes({
  flattened,
  input,
  state,
}: {
  flattened: FlattenedOntology
  input: WorkspaceOntologyInput
  state: WorkspaceOntologyState
}) {
  const rootId = state.expandedRootIds[0]
  if (!rootId) return { nodes: [], activeNodeIds: [] }
  const activeNodeIds = resolveActiveFocusPath({
    flattened,
    state,
    rootId,
  })
  const childrenByParentId = buildChildrenByParentId(flattened.nodes)
  const nodes: WorkspaceOntologyProjectedNode[] = []
  const rootLabel =
    input.roots.find((root) => root.id === rootId)?.label ?? "Next steps"
  let parentId: string = rootId
  let graphParentId: string = rootId
  for (let depth = 0; depth <= activeNodeIds.length; depth += 1) {
    const children = childrenByParentId.get(parentId) ?? []
    if (children.length === 0) break
    const preferredChildId = activeNodeIds[depth]
    const listNode = buildFocusListNode({
      children,
      graphParentId,
      parentId,
      parentLabel:
        flattened.nodeById.get(parentId)?.label ?? `${rootLabel} details`,
      preferredChildId,
      rootId,
    })
    nodes.push(listNode)
    if (!preferredChildId) break
    parentId = preferredChildId
    graphParentId = listNode.id
  }
  return { nodes, activeNodeIds }
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
  const focusProjection = buildFocusNodes({ flattened, input, state })
  const baseNodes = query
    ? flattened.nodes.filter((node) => queryVisibleIds.has(node.id))
    : state.mode === "map"
      ? flattened.nodes
      : focusProjection.nodes
  const nodes = baseNodes.flatMap((node) => {
    const visibleThroughSearch = query ? queryVisibleIds.has(node.id) : false
    if (node.presentation === "list" && activeCategorySet.size > 0) {
      const visibleItems = (node.items ?? []).filter((item) =>
        categoryVisibleIds.has(item.id)
      )
      if (
        visibleItems.length === 0 &&
        !categoryVisibleIds.has(node.listParentId ?? "")
      ) {
        return []
      }
      return [{ ...node, items: visibleItems }]
    }
    if (
      activeCategorySet.size > 0 &&
      !categoryVisibleIds.has(node.id) &&
      !visibleThroughSearch
    ) {
      return []
    }
    return [node]
  })
  const visibleIdSet = new Set(nodes.map((node) => node.id))
  const edges: WorkspaceOntologyProjectedEdge[] = []
  const edgeIds = new Set<string>()
  const edgeTuples = new Set<string>()
  const labeledHierarchySources = new Set<string>()
  const activeFocusNodeIds =
    state.mode === "focus" ? focusProjection.activeNodeIds : []
  const activeNodeIdSet = new Set(activeFocusNodeIds)
  const activeRootId =
    state.mode === "focus" ? state.expandedRootIds[0] : undefined
  const activeParentId = activeFocusNodeIds.at(-1) ?? activeRootId ?? null
  for (const node of nodes) {
    if (node.parentId !== node.rootId && !visibleIdSet.has(node.parentId)) {
      continue
    }
    const listContainsActiveItem = node.items?.some((item) =>
      activeNodeIdSet.has(item.id)
    )
    const edge = {
      id: `ontology-edge:${node.parentId}:${node.id}`,
      source: node.parentId,
      target: node.id,
      label: node.relationshipLabel,
      category: node.category,
      status: node.status,
      kind: "hierarchy",
      showLabel: !labeledHierarchySources.has(node.parentId),
      active:
        node.rootId === activeRootId &&
        (activeNodeIdSet.has(node.id) ||
          listContainsActiveItem ||
          node.listParentId === activeParentId ||
          node.parentId === activeParentId),
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
    edges.push({
      ...relationship,
      kind: "relationship",
      showLabel: true,
      active:
        activeNodeIdSet.has(relationship.source) ||
        activeNodeIdSet.has(relationship.target),
    })
  }
  return {
    nodes,
    edges,
    allNodes: flattened.nodes,
    resultNodeIds: resultIds,
    activeNodeIds: activeFocusNodeIds,
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
