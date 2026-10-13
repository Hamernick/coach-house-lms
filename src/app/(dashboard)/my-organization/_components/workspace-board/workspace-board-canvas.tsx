"use client"

import { useCallback, useMemo, useRef, useState } from "react"

import { WORKSPACE_EDGE_SPECS } from "./workspace-board-copy"
import { applyAutoLayout } from "./workspace-board-layout"
import { WorkspaceBoardFlowSurface } from "./workspace-board-flow-surface"
import { WorkspaceBoardRightRail } from "./workspace-board-right-rail"
import type {
  WorkspaceBoardState,
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceCollaborationInvite,
  WorkspaceCommunicationsState,
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
  WorkspaceTrackerState,
} from "./workspace-board-types"

const WORKSPACE_ALWAYS_HIDDEN_CARD_IDS: WorkspaceCardId[] = ["deck", "atlas"]

export function WorkspaceBoardCanvas({
  seed,
  organizationEditorData,
}: {
  seed: WorkspaceSeedData
  organizationEditorData: WorkspaceOrganizationEditorData
}) {
  const presentationMode = seed.presentationMode
  const allowEditing = seed.canEdit && !presentationMode
  const workspaceRoomName = `org:${seed.orgId}:workspace`
  const [boardState, setBoardState] = useState<WorkspaceBoardState>(seed.boardState)
  const [invites, setInvites] = useState<WorkspaceCollaborationInvite[]>(seed.collaborationInvites)
  const [cursorConnectionState, setCursorConnectionState] = useState<"connecting" | "live" | "degraded">(
    "connecting",
  )
  const [layoutFitRequestKey, setLayoutFitRequestKey] = useState(0)
  const layoutRequestIdRef = useRef(0)
  const forcedHiddenCardIdSet = useMemo(
    () =>
      new Set<WorkspaceCardId>([
        ...WORKSPACE_ALWAYS_HIDDEN_CARD_IDS,
        ...(seed.acceleratorOverlayEnabled ? [] : (["formation-status"] as WorkspaceCardId[])),
      ]),
    [seed.acceleratorOverlayEnabled],
  )

  const handleSizeChange = useCallback(
    (cardId: WorkspaceCardId, size: WorkspaceCardSize) => {
      if (!allowEditing) return
      setBoardState((previous) => ({
        ...previous,
        nodes: previous.nodes.map((node) => (node.id === cardId ? { ...node, size } : node)),
      }))
    },
    [allowEditing],
  )

  const handleCommunicationsChange = useCallback(
    (next: WorkspaceCommunicationsState) => {
      if (!allowEditing) return
      setBoardState((previous) => ({
        ...previous,
        communications: next,
      }))
    },
    [allowEditing],
  )

  const handleTrackerChange = useCallback(
    (next: WorkspaceTrackerState) => {
      if (!allowEditing) return
      setBoardState((previous) => ({
        ...previous,
        tracker: next,
      }))
    },
    [allowEditing],
  )

  const handlePersistNodePosition = useCallback((cardId: WorkspaceCardId, x: number, y: number) => {
    setBoardState((previous) => ({
      ...previous,
      nodes: previous.nodes.map((entry) =>
        entry.id === cardId
          ? {
              ...entry,
              x,
              y,
            }
          : entry,
      ),
    }))
  }, [])

  const handlePresetChange = useCallback(
    (preset: WorkspaceBoardState["preset"]) => {
      if (!allowEditing) return
      const sourceNodes = boardState.nodes
      const requestId = layoutRequestIdRef.current + 1
      layoutRequestIdRef.current = requestId

      setBoardState((previous) => ({
        ...previous,
        preset,
      }))
      void (async () => {
        const nextNodes = await applyAutoLayout(sourceNodes, preset)
        if (layoutRequestIdRef.current !== requestId) return
        setBoardState((previous) => ({
          ...previous,
          preset,
          nodes: nextNodes,
        }))
        setLayoutFitRequestKey((previous) => previous + 1)
      })()
    },
    [allowEditing, boardState.nodes],
  )

  const handleToggleCardVisibility = useCallback(
    (cardId: WorkspaceCardId) => {
      if (!allowEditing) return
      if (forcedHiddenCardIdSet.has(cardId)) return
      setBoardState((previous) => {
        const isCurrentlyHidden = previous.hiddenCardIds.includes(cardId)
        if (isCurrentlyHidden) {
          return {
            ...previous,
            hiddenCardIds: previous.hiddenCardIds.filter((entry) => entry !== cardId),
          }
        }

        const hiddenSet = new Set<WorkspaceCardId>([...previous.hiddenCardIds, ...forcedHiddenCardIdSet])
        const visibleCount = previous.nodes.length - hiddenSet.size
        if (visibleCount <= 1) return previous

        return {
          ...previous,
          hiddenCardIds: [...previous.hiddenCardIds, cardId],
        }
      })
      setLayoutFitRequestKey((previous) => previous + 1)
    },
    [allowEditing, forcedHiddenCardIdSet],
  )

  const handleConnectCards = useCallback(
    (source: WorkspaceCardId, target: WorkspaceCardId) => {
      if (!allowEditing) return
      if (source === target) return

      setBoardState((previous) => {
        const hasConnection = previous.connections.some(
          (connection) => connection.source === source && connection.target === target,
        )
        if (hasConnection) return previous

        return {
          ...previous,
          connections: [
            ...previous.connections,
            {
              id: `edge-${source}-to-${target}-${Date.now().toString(36)}`,
              source,
              target,
            },
          ],
        }
      })
    },
    [allowEditing],
  )

  const handleDisconnectConnection = useCallback((connectionId: string) => {
    if (!allowEditing) return
    setBoardState((previous) => ({
      ...previous,
      connections: previous.connections.filter((connection) => connection.id !== connectionId),
    }))
  }, [allowEditing])

  const handleDisconnectAllConnections = useCallback(() => {
    if (!allowEditing) return
    setBoardState((previous) => ({
      ...previous,
      connections: [],
    }))
  }, [allowEditing])

  const handleResetDefaultConnections = useCallback(() => {
    if (!allowEditing) return
    setBoardState((previous) => ({
      ...previous,
      connections: WORKSPACE_EDGE_SPECS.map((edge) => ({ ...edge })),
    }))
  }, [allowEditing])

  const rightRailCurrentUser = useMemo(
    () => ({
      id: seed.viewerId,
      name: seed.viewerName,
      avatarUrl: seed.viewerAvatarUrl,
    }),
    [seed.viewerAvatarUrl, seed.viewerId, seed.viewerName],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkspaceBoardRightRail
        preset={boardState.preset}
        canEdit={allowEditing}
        canInvite={seed.canInviteCollaborators}
        members={seed.members}
        invites={invites}
        realtimeState={cursorConnectionState}
        currentUser={rightRailCurrentUser}
        onPresetChange={handlePresetChange}
        onInvitesChange={setInvites}
      />

      <WorkspaceBoardFlowSurface
        seed={seed}
        organizationEditorData={organizationEditorData}
        boardState={boardState}
        allowEditing={allowEditing}
        presentationMode={presentationMode}
        workspaceRoomName={workspaceRoomName}
        layoutFitRequestKey={layoutFitRequestKey}
        onSizeChange={handleSizeChange}
        onCommunicationsChange={handleCommunicationsChange}
        onTrackerChange={handleTrackerChange}
        onPersistNodePosition={handlePersistNodePosition}
        onToggleCardVisibility={handleToggleCardVisibility}
        onConnectCards={handleConnectCards}
        onDisconnectConnection={handleDisconnectConnection}
        onDisconnectAllConnections={handleDisconnectAllConnections}
        onResetDefaultConnections={handleResetDefaultConnections}
        onCursorConnectionStateChange={setCursorConnectionState}
      />
    </div>
  )
}
