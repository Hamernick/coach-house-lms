"use client"

import { memo, useLayoutEffect, useRef } from "react"
import { type NodeProps } from "reactflow"

import { useWorkspaceNodeInternalsSync } from "@/lib/workspace-canvas/node-internals-sync"
import { cn } from "@/lib/utils"

import { resolveWorkspaceCardHeightModeClassName } from "./workspace-board-layout-config"
import { WorkspaceBoardCard } from "./workspace-board-node-card"
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
  const lastReportedHeightRef = useRef<number | null>(null)
  useWorkspaceNodeInternalsSync(id, nodeRef)

  useLayoutEffect(() => {
    const element = nodeRef.current
    const onMeasuredHeightChange = data.onMeasuredHeightChange
    if (!element || !onMeasuredHeightChange) return

    const reportHeight = () => {
      const nextHeight = Math.round(element.offsetHeight)
      if (lastReportedHeightRef.current === nextHeight) return
      lastReportedHeightRef.current = nextHeight
      onMeasuredHeightChange(data.size, nextHeight)
    }

    reportHeight()

    if (typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver(() => {
      reportHeight()
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [data.onMeasuredHeightChange, data.size])

  return (
    <div
      ref={nodeRef}
      className={cn(
        "relative min-h-0 w-full min-w-0",
        resolveWorkspaceCardHeightModeClassName(data.cardId),
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
