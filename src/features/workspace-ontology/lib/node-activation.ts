import type {
  WorkspaceOntologyActionTarget,
  WorkspaceOntologyProjectedNode,
  WorkspaceOntologyRootId,
} from "../types"

export type WorkspaceOntologyNodeActivation =
  | { kind: "toggle-details"; nodeId: string }
  | { kind: "navigate"; href: string }
  | {
      kind: "open-action"
      rootId: WorkspaceOntologyRootId
      target: WorkspaceOntologyActionTarget
    }
  | { kind: "focus-root"; rootId: WorkspaceOntologyRootId }

const ROOT_LABEL: Record<WorkspaceOntologyRootId, string> = {
  "organization-overview": "Organization",
  programs: "Activity",
  accelerator: "Accelerator",
  roadmap: "Roadmap",
  calendar: "Calendar",
  "fiscal-sponsorship": "Fiscal sponsorship",
}

export function resolveWorkspaceOntologyNodeActivation(
  node: WorkspaceOntologyProjectedNode
): WorkspaceOntologyNodeActivation {
  if (node.hasChildren) {
    return { kind: "toggle-details", nodeId: node.id }
  }
  if (node.href) {
    return { kind: "navigate", href: node.href }
  }
  if (node.actionTarget) {
    return {
      kind: "open-action",
      rootId: node.rootId,
      target: node.actionTarget,
    }
  }
  return { kind: "focus-root", rootId: node.rootId }
}

export function describeWorkspaceOntologyNodeActivation({
  node,
  expanded,
}: {
  node: WorkspaceOntologyProjectedNode
  expanded: boolean
}) {
  if (node.hasChildren) {
    return `${expanded ? "Hide" : "Show"} ${node.childCount} details`
  }
  return node.actionLabel ?? `Go to ${ROOT_LABEL[node.rootId]} card`
}
