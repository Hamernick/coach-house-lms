import { Handle, Position } from "reactflow"

import { resolveWorkspaceBoardHandleClassName } from "@/lib/workspace-canvas/handle-styles"

import {
  ACCELERATOR_STEP_SIDE_SOURCE_HANDLE_ID,
  ACCELERATOR_STEP_TOP_SOURCE_HANDLE_ID,
} from "./workspace-board-accelerator-step-layout"
import type { WorkspaceCardId } from "./workspace-board-types"

export function WorkspaceBoardNodeConnectionHandles({
  cardId,
  presentationMode,
}: {
  cardId: WorkspaceCardId
  presentationMode: boolean
}) {
  return (
    <>
      <Handle
        type="source"
        position={Position.Right}
        id={cardId === "accelerator" ? ACCELERATOR_STEP_SIDE_SOURCE_HANDLE_ID : undefined}
        className={resolveWorkspaceBoardHandleClassName({
          position: Position.Right,
          hidden: presentationMode,
        })}
      />
      {cardId === "accelerator" ? (
        <Handle
          type="source"
          position={Position.Top}
          id={ACCELERATOR_STEP_TOP_SOURCE_HANDLE_ID}
          className={resolveWorkspaceBoardHandleClassName({
            position: Position.Top,
            hidden: true,
          })}
        />
      ) : null}
      <Handle
        type="target"
        position={Position.Left}
        className={resolveWorkspaceBoardHandleClassName({
          position: Position.Left,
          hidden: presentationMode,
        })}
      />
    </>
  )
}
