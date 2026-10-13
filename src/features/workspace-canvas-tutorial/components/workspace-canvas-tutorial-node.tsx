"use client"

import { memo, useRef } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

import { resolveWorkspaceBoardHandleClassName } from "@/lib/workspace-canvas/handle-styles"
import { useWorkspaceNodeInternalsSync } from "@/lib/workspace-canvas/node-internals-sync"

import type { WorkspaceCanvasTutorialNodeData } from "../types"

import { WorkspaceCanvasTutorialPanel } from "./workspace-canvas-tutorial-panel"

export const WorkspaceCanvasTutorialNode = memo(
  function WorkspaceCanvasTutorialNode({
    id,
    data,
  }: NodeProps<WorkspaceCanvasTutorialNodeData>) {
    const nodeRef = useRef<HTMLDivElement>(null)
    useWorkspaceNodeInternalsSync(id, nodeRef)

    return (
      <div ref={nodeRef} className="relative h-auto w-full min-w-0">
        <WorkspaceCanvasTutorialPanel
          stepIndex={data.stepIndex}
          openedStepIds={data.openedStepIds}
          onPrevious={data.onPrevious}
          onNext={data.onNext}
          className="mx-0 max-w-none"
          dragHandleClassName="workspace-tutorial-card-drag-handle cursor-grab active:cursor-grabbing"
        />
        <Handle
          type="source"
          position={Position.Right}
          className={resolveWorkspaceBoardHandleClassName({
            position: Position.Right,
          })}
          isConnectable={false}
        />
      </div>
    )
  },
)

WorkspaceCanvasTutorialNode.displayName = "WorkspaceCanvasTutorialNode"
