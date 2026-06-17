"use client"

import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"

import {
  buildWorkspaceCanvasPersonNode,
  toWorkspaceCanvasPersonNodePerson,
  type WorkspaceCanvasPersonNodeData,
  type WorkspaceCanvasPersonPlacement,
} from "./workspace-canvas-person-node-model"
import type { WorkspaceCanvasNode } from "./workspace-canvas-surface-v2-helpers"

function areWorkspaceCanvasPersonNodePeopleEqual(
  left: WorkspaceCanvasPersonNodeData["person"],
  right: WorkspaceCanvasPersonNodeData["person"]
) {
  return (
    left.id === right.id &&
    left.name === right.name &&
    left.title === right.title &&
    left.email === right.email &&
    left.image === right.image &&
    left.category === right.category
  )
}

function areWorkspaceCanvasPersonNodeDataEqual(
  left: WorkspaceCanvasPersonNodeData,
  right: WorkspaceCanvasPersonNodeData
) {
  return (
    left.kind === right.kind &&
    left.canEdit === right.canEdit &&
    left.onRemove === right.onRemove &&
    areWorkspaceCanvasPersonNodePeopleEqual(left.person, right.person)
  )
}

export function reconcileWorkspacePersonNode({
  existingPersonNode,
  placement,
  person,
  allowPeopleCanvasInteraction,
  onRemoveWorkspacePerson,
}: {
  existingPersonNode?: WorkspaceCanvasNode
  placement: WorkspaceCanvasPersonPlacement
  person: OrgPersonWithImage
  allowPeopleCanvasInteraction: boolean
  onRemoveWorkspacePerson: (personId: string) => void
}) {
  const nextNode = buildWorkspaceCanvasPersonNode({
    placement,
    person,
    canEdit: allowPeopleCanvasInteraction,
    onRemove: onRemoveWorkspacePerson,
  })

  if (!existingPersonNode || existingPersonNode.type !== "workspace-person") {
    return nextNode
  }

  const nextPosition = existingPersonNode.dragging
    ? existingPersonNode.position
    : nextNode.position
  const samePosition =
    existingPersonNode.position.x === nextPosition.x &&
    existingPersonNode.position.y === nextPosition.y
  const sameWidth = existingPersonNode.style?.width === nextNode.style?.width
  const sameHeight =
    existingPersonNode.style?.minHeight === nextNode.style?.minHeight
  const sameDraggable = existingPersonNode.draggable === nextNode.draggable
  const sameSelectable = existingPersonNode.selectable === nextNode.selectable
  const sameData = areWorkspaceCanvasPersonNodeDataEqual(
    existingPersonNode.data as WorkspaceCanvasPersonNodeData,
    {
      kind: "workspace-person",
      person: toWorkspaceCanvasPersonNodePerson(person),
      canEdit: allowPeopleCanvasInteraction,
      onRemove: onRemoveWorkspacePerson,
    }
  )

  if (
    samePosition &&
    sameWidth &&
    sameHeight &&
    sameDraggable &&
    sameSelectable &&
    sameData
  ) {
    return existingPersonNode
  }

  return {
    ...existingPersonNode,
    ...nextNode,
    position: samePosition ? existingPersonNode.position : nextPosition,
    style: sameWidth && sameHeight ? existingPersonNode.style : nextNode.style,
    data: sameData ? existingPersonNode.data : nextNode.data,
  }
}
