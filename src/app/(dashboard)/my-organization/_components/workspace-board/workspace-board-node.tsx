"use client"

import { memo, useRef } from "react"
import { type NodeProps } from "reactflow"

import { useWorkspaceNodeInternalsSync } from "@/lib/workspace-canvas/node-internals-sync"
import { cn } from "@/lib/utils"

import { WorkspaceBoardCard } from "./workspace-board-node-card"
import { isWorkspaceNodeAutoHeightCard } from "./workspace-board-node-class-name"
import { WorkspaceBoardNodeConnectionHandles as ConnectionHandles } from "./workspace-board-node-connection-handles"

export { WorkspaceBoardAcceleratorStepNode } from "./workspace-board-node-accelerator-step"
export { WorkspaceBoardCard } from "./workspace-board-node-card"
export type {
  WorkspaceBoardAcceleratorStepNodeData,
  WorkspaceBoardNodeData,
} from "./workspace-board-node-types"
import type { WorkspaceBoardNodeData } from "./workspace-board-node-types"

export const WorkspaceBoardNode = memo(function WorkspaceBoardNode({
  id,
  data,
}: NodeProps<WorkspaceBoardNodeData>) {
  const nodeRef = useRef<HTMLDivElement>(null)
  useWorkspaceNodeInternalsSync(id, nodeRef)

  return (
    <div
      ref={nodeRef}
      className={cn(
        "relative min-h-0 w-full min-w-0",
        isWorkspaceNodeAutoHeightCard(data.cardId) ? "h-auto" : "h-full",
      )}
    >
      <WorkspaceBoardCard data={data} />
      <ConnectionHandles
        cardId={data.cardId}
        presentationMode={data.presentationMode}
      />
    </div>
  )
})

WorkspaceBoardNode.displayName = "WorkspaceBoardNode"
