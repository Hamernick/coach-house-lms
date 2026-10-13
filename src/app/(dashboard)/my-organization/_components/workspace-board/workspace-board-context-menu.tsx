"use client"

import { useMemo } from "react"

import { WORKSPACE_CARD_META } from "./workspace-board-copy"
import type { WorkspaceCardId, WorkspaceConnectionState } from "./workspace-board-types"
import { cn } from "@/lib/utils"

export type WorkspaceFlowContextMenuState =
  | {
      kind: "canvas"
      x: number
      y: number
    }
  | {
      kind: "node"
      x: number
      y: number
      nodeId: WorkspaceCardId
      handleKind: "source" | "target" | null
    }
  | {
      kind: "edge"
      x: number
      y: number
      edgeId: string
      source: WorkspaceCardId
      target: WorkspaceCardId
    }

type WorkspaceBoardContextMenuProps = {
  state: WorkspaceFlowContextMenuState
  visibleCardIds: WorkspaceCardId[]
  connections: WorkspaceConnectionState[]
  onClose: () => void
  onRepairCanvas: () => void
  onHideCard: (cardId: WorkspaceCardId) => void
  onConnect: (source: WorkspaceCardId, target: WorkspaceCardId) => void
  onDisconnect: (edgeId: string) => void
  onDisconnectAll: () => void
  onResetDefaultConnections: () => void
}

function menuSectionTitle(value: string) {
  return <p className="px-1 pb-1 text-[10px] font-semibold text-muted-foreground">{value}</p>
}

export function WorkspaceBoardContextMenu({
  state,
  visibleCardIds,
  connections,
  onClose,
  onRepairCanvas,
  onHideCard,
  onConnect,
  onDisconnect,
  onDisconnectAll,
  onResetDefaultConnections,
}: WorkspaceBoardContextMenuProps) {
  const nodeDetails = useMemo(() => {
    if (state.kind !== "node") return null
    const nodeId = state.nodeId
    const outgoingConnections = connections.filter((connection) => connection.source === nodeId)
    const incomingConnections = connections.filter((connection) => connection.target === nodeId)

    const connectToTargets = visibleCardIds.filter(
      (cardId) =>
        cardId !== nodeId &&
        !connections.some(
          (connection) => connection.source === nodeId && connection.target === cardId,
        ),
    )
    const connectFromSources = visibleCardIds.filter(
      (cardId) =>
        cardId !== nodeId &&
        !connections.some(
          (connection) => connection.source === cardId && connection.target === nodeId,
        ),
    )

    return {
      nodeId,
      outgoingConnections,
      incomingConnections,
      connectToTargets,
      connectFromSources,
    }
  }, [connections, state, visibleCardIds])

  return (
    <div
      className="absolute inset-0 z-40"
      onClick={onClose}
      onContextMenu={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div
        role="menu"
        aria-label="Workspace context menu"
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "absolute min-w-[240px] max-w-[320px] overflow-hidden rounded-xl border border-border/70 bg-card/95 p-1 shadow-xl backdrop-blur",
          "max-h-[min(70vh,420px)] overflow-y-auto",
        )}
        style={{
          left: `${Math.max(8, state.x)}px`,
          top: `${Math.max(8, state.y)}px`,
        }}
      >
        {state.kind === "canvas" ? (
          <div className="space-y-1">
            {menuSectionTitle("Canvas")}
            <button
              type="button"
              className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent/60"
              onClick={() => {
                onRepairCanvas()
                onClose()
              }}
            >
              Repair rails + recenter
            </button>
            <button
              type="button"
              className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent/60"
              onClick={() => {
                onResetDefaultConnections()
                onClose()
              }}
            >
              Reset rails to default
            </button>
            <button
              type="button"
              className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent/60"
              onClick={() => {
                onDisconnectAll()
                onClose()
              }}
            >
              Disconnect all rails
            </button>
          </div>
        ) : null}

        {state.kind === "edge" ? (
          <div className="space-y-1">
            {menuSectionTitle("Rail")}
            <p className="px-1 text-xs text-muted-foreground">
              {WORKSPACE_CARD_META[state.source].title}
              {" -> "}
              {WORKSPACE_CARD_META[state.target].title}
            </p>
            <button
              type="button"
              className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent/60"
              onClick={() => {
                onDisconnect(state.edgeId)
                onClose()
              }}
            >
              Disconnect rail
            </button>
          </div>
        ) : null}

        {state.kind === "node" && nodeDetails ? (
          <div className="space-y-2">
            {menuSectionTitle(
              state.handleKind === "source"
                ? "Source Rail Controls"
                : state.handleKind === "target"
                  ? "Target Rail Controls"
                  : "Card Controls",
            )}

            <p className="px-1 text-xs text-muted-foreground">
              {WORKSPACE_CARD_META[nodeDetails.nodeId].title}
            </p>

            <button
              type="button"
              className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent/60"
              onClick={() => {
                onHideCard(nodeDetails.nodeId)
                onClose()
              }}
            >
              Hide card
            </button>

            {state.handleKind !== "target" ? (
              <div className="space-y-1">
                {menuSectionTitle("Connect To")}
                {nodeDetails.connectToTargets.length === 0 ? (
                  <p className="px-1 text-[11px] text-muted-foreground">No available targets.</p>
                ) : (
                  nodeDetails.connectToTargets.map((targetId) => (
                    <button
                      key={`connect-to-${targetId}`}
                      type="button"
                      className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent/60"
                      onClick={() => {
                        onConnect(nodeDetails.nodeId, targetId)
                        onClose()
                      }}
                    >
                      {WORKSPACE_CARD_META[targetId].title}
                    </button>
                  ))
                )}
              </div>
            ) : null}

            {state.handleKind !== "source" ? (
              <div className="space-y-1">
                {menuSectionTitle("Connect From")}
                {nodeDetails.connectFromSources.length === 0 ? (
                  <p className="px-1 text-[11px] text-muted-foreground">No available sources.</p>
                ) : (
                  nodeDetails.connectFromSources.map((sourceId) => (
                    <button
                      key={`connect-from-${sourceId}`}
                      type="button"
                      className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent/60"
                      onClick={() => {
                        onConnect(sourceId, nodeDetails.nodeId)
                        onClose()
                      }}
                    >
                      {WORKSPACE_CARD_META[sourceId].title}
                    </button>
                  ))
                )}
              </div>
            ) : null}

            <div className="space-y-1">
              {menuSectionTitle("Disconnect")}
              {nodeDetails.outgoingConnections.length === 0 && nodeDetails.incomingConnections.length === 0 ? (
                <p className="px-1 text-[11px] text-muted-foreground">No rails attached.</p>
              ) : (
                <>
                  {nodeDetails.outgoingConnections.map((connection) => (
                    <button
                      key={`disconnect-out-${connection.id}`}
                      type="button"
                      className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent/60"
                      onClick={() => {
                        onDisconnect(connection.id)
                        onClose()
                      }}
                    >
                      {WORKSPACE_CARD_META[nodeDetails.nodeId].title}
                      {" -> "}
                      {WORKSPACE_CARD_META[connection.target].title}
                    </button>
                  ))}
                  {nodeDetails.incomingConnections.map((connection) => (
                    <button
                      key={`disconnect-in-${connection.id}`}
                      type="button"
                      className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent/60"
                      onClick={() => {
                        onDisconnect(connection.id)
                        onClose()
                      }}
                    >
                      {WORKSPACE_CARD_META[connection.source].title}
                      {" -> "}
                      {WORKSPACE_CARD_META[nodeDetails.nodeId].title}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
