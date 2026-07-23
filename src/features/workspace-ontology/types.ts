export const WORKSPACE_ONTOLOGY_CATEGORIES = [
  "organization",
  "programs",
  "people",
  "accelerator",
  "roadmap",
  "documents",
  "activity",
  "tasks",
  "calendar",
  "fiscal",
] as const

export type WorkspaceOntologyCategory =
  (typeof WORKSPACE_ONTOLOGY_CATEGORIES)[number]

export const WORKSPACE_ONTOLOGY_STATUSES = [
  "missing",
  "blocked",
  "in-progress",
  "complete",
] as const

export type WorkspaceOntologyStatus =
  (typeof WORKSPACE_ONTOLOGY_STATUSES)[number]

export const WORKSPACE_ONTOLOGY_ROOT_IDS = [
  "organization-overview",
  "programs",
  "accelerator",
  "roadmap",
  "calendar",
  "fiscal-sponsorship",
] as const

export type WorkspaceOntologyRootId =
  (typeof WORKSPACE_ONTOLOGY_ROOT_IDS)[number]

export type WorkspaceOntologyActionTarget =
  | {
      kind: "calendar-event"
      eventId: string
    }
  | {
      kind: "fiscal-phase"
      phaseId: "application-intake" | "required-documents"
    }
  | {
      kind: "task"
      ticketId: string | null
    }

export type WorkspaceOntologyActionRequest = {
  id: number
  rootId: WorkspaceOntologyRootId
  target: WorkspaceOntologyActionTarget
}

export type WorkspaceOntologyNodeInput = {
  id: string
  label: string
  description: string
  category: WorkspaceOntologyCategory
  kind: string
  status: WorkspaceOntologyStatus
  statusLabel: string
  relationshipLabel: string
  href: string | null
  actionLabel: string | null
  actionTarget?: WorkspaceOntologyActionTarget | null
  focusRoot?: boolean
  ownerLabel?: string | null
  keywords?: string[]
  children?: WorkspaceOntologyNodeInput[]
}

export type WorkspaceOntologyRootInput = {
  id: WorkspaceOntologyRootId
  label: string
  children: WorkspaceOntologyNodeInput[]
}

export type WorkspaceOntologyRelationshipInput = {
  id: string
  source: string
  target: string
  label: string
  category: WorkspaceOntologyCategory
  status: WorkspaceOntologyStatus
}

export type WorkspaceOntologyInput = {
  roots: WorkspaceOntologyRootInput[]
  relationships?: WorkspaceOntologyRelationshipInput[]
}

export type WorkspaceOntologyPosition = {
  x: number
  y: number
}

export type WorkspaceOntologyNodeSize = {
  width: number
  height: number
}

export type WorkspaceOntologyState = {
  updatedAt: string | null
  expandedRootIds: WorkspaceOntologyRootId[]
  expandedNodeIds: string[]
  /** @deprecated Generated ontology nodes are positioned by the scene layout. */
  pinnedNodeIds: string[]
  /** @deprecated Generated ontology nodes are positioned by the scene layout. */
  nodePositions: Record<string, WorkspaceOntologyPosition>
}

export type WorkspaceOntologyFilter = {
  query: string
  categories: WorkspaceOntologyCategory[]
}

export type WorkspaceOntologyProjectedNode = Omit<
  WorkspaceOntologyNodeInput,
  "children"
> & {
  rootId: WorkspaceOntologyRootId
  parentId: string
  depth: number
  childCount: number
  hasChildren: boolean
}

export type WorkspaceOntologyProjectedEdge = {
  id: string
  source: string
  target: string
  label: string
  category: WorkspaceOntologyCategory
  status: WorkspaceOntologyStatus
  kind: "hierarchy" | "relationship"
  showLabel: boolean
}

export type WorkspaceOntologyProjection = {
  nodes: WorkspaceOntologyProjectedNode[]
  edges: WorkspaceOntologyProjectedEdge[]
  allNodes: WorkspaceOntologyProjectedNode[]
  resultNodeIds: string[]
}

export type WorkspaceOntologyRootGeometry = WorkspaceOntologyPosition & {
  width: number
  height: number
}

export type WorkspaceOntologyRootPositions = Partial<
  Record<WorkspaceOntologyRootId, WorkspaceOntologyPosition>
>

export type WorkspaceOntologyObstacle = WorkspaceOntologyRootGeometry & {
  id: string
}

export type WorkspaceOntologyLayoutNode = WorkspaceOntologyProjectedNode & {
  position: WorkspaceOntologyPosition
  size: WorkspaceOntologyNodeSize
}

export type WorkspaceOntologyDetailLevel = "overview" | "standard" | "full"

export type WorkspaceOntologyRootControl = {
  expanded: boolean
  attentionCount: number
  completedCount: number
  descendantCount: number
  onToggle: () => void
}
