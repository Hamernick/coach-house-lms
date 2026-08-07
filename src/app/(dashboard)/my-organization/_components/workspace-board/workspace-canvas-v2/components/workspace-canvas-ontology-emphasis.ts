type WorkspaceOntologyEmphasisNode = {
  id: string
  items?: { id: string }[]
  listParentId?: string
  parentId: string
  rootId: string
}

export function buildWorkspaceOntologyEmphasisResolver(
  activeNodeIds: string[],
  activeRootId: string | null
) {
  const activeNodeIdSet = new Set(activeNodeIds)
  const activeParentId = activeNodeIds.at(-1) ?? activeRootId

  return (node: WorkspaceOntologyEmphasisNode) => {
    const containsActiveItem = node.items?.some((item) =>
      activeNodeIdSet.has(item.id)
    )
    const representsActiveParent = node.listParentId === activeParentId
    const active =
      activeNodeIdSet.has(node.id) ||
      Boolean(containsActiveItem) ||
      representsActiveParent
    return {
      active,
      dimmed: Boolean(
        activeRootId &&
        (node.rootId !== activeRootId ||
          (activeNodeIds.length > 0 &&
            !active &&
            node.parentId !== activeParentId))
      ),
    }
  }
}
