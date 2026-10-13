"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

import { WorkspaceAcceleratorCardPanel } from "@/features/workspace-accelerator-card/components"
import { cn } from "@/lib/utils"

import { WorkspaceBoardCalendarCard } from "./workspace-board-calendar-card"
import { WorkspaceBoardCardFrame } from "./workspace-board-card-frame"
import { WorkspaceBoardCommunicationsCard } from "./workspace-board-communications-card"
import { WORKSPACE_CARD_META } from "./workspace-board-copy"
import {
  WorkspaceBoardAtlasCard,
  WorkspaceBoardDeckCard,
  WorkspaceBoardVaultCard,
} from "./workspace-board-node-tool-cards"
import {
  BrandKitCard,
  EconomicEngineCard,
  OrganizationOverviewCard,
} from "./workspace-board-node-static-cards"
import type {
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceCommunicationsState,
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
  WorkspaceTrackerTicketStatus,
  WorkspaceTrackerState,
} from "./workspace-board-types"

export type WorkspaceBoardNodeData = {
  cardId: WorkspaceCardId
  size: WorkspaceCardSize
  canEdit: boolean
  presentationMode: boolean
  communications: WorkspaceCommunicationsState
  tracker: WorkspaceTrackerState
  seed: WorkspaceSeedData
  organizationEditorData?: WorkspaceOrganizationEditorData
  onSizeChange: (cardId: WorkspaceCardId, size: WorkspaceCardSize) => void
  onCommunicationsChange: (next: WorkspaceCommunicationsState) => void
  onTrackerChange: (next: WorkspaceTrackerState) => void
  isCanvasFullscreen?: boolean
  onToggleCanvasFullscreen?: (cardId: WorkspaceCardId) => void
}

function ConnectionHandles({ presentationMode }: { presentationMode: boolean }) {
  return (
    <>
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!h-2 !w-2 !bg-muted-foreground/55",
          presentationMode && "!opacity-0 !pointer-events-none",
        )}
      />
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "!h-2 !w-2 !bg-muted-foreground/55",
          presentationMode && "!opacity-0 !pointer-events-none",
        )}
      />
    </>
  )
}

type WorkspaceBoardCardProps = {
  data: WorkspaceBoardNodeData
}

function workspaceBoardCardPropsEqual(
  previous: WorkspaceBoardCardProps,
  next: WorkspaceBoardCardProps,
) {
  const prevData = previous.data
  const nextData = next.data

  if (prevData === nextData) return true
  if (prevData.cardId !== nextData.cardId) return false
  if (prevData.size !== nextData.size) return false
  if (prevData.canEdit !== nextData.canEdit) return false
  if (prevData.presentationMode !== nextData.presentationMode) return false
  if (prevData.isCanvasFullscreen !== nextData.isCanvasFullscreen) return false
  if (prevData.seed !== nextData.seed) return false
  if (prevData.onSizeChange !== nextData.onSizeChange) return false
  if (prevData.onCommunicationsChange !== nextData.onCommunicationsChange) return false
  if (prevData.onTrackerChange !== nextData.onTrackerChange) return false
  if (prevData.onToggleCanvasFullscreen !== nextData.onToggleCanvasFullscreen) return false
  if (prevData.organizationEditorData !== nextData.organizationEditorData) return false

  if (prevData.cardId === "communications") {
    return prevData.communications === nextData.communications
  }

  if (prevData.cardId === "formation-status") {
    return prevData.tracker === nextData.tracker
  }

  return true
}

function resolveNextTrackerStatus(status: WorkspaceTrackerTicketStatus): WorkspaceTrackerTicketStatus {
  if (status === "todo") return "in_progress"
  if (status === "in_progress") return "done"
  return "todo"
}

export const WorkspaceBoardCard = memo(function WorkspaceBoardCard({
  data,
}: WorkspaceBoardCardProps) {
  const {
    cardId,
    size,
    seed,
    canEdit,
    presentationMode,
    communications,
    tracker,
    onSizeChange,
    onCommunicationsChange,
    onTrackerChange,
    isCanvasFullscreen = false,
    onToggleCanvasFullscreen,
  } = data
  const cardMeta = WORKSPACE_CARD_META[cardId]
  const hideHeaderTitle = cardId === "organization-overview"
  const hideHeaderSubtitle =
    cardId === "organization-overview" ||
    cardId === "formation-status" ||
    cardId === "calendar" ||
    cardId === "communications"
  const handleFullscreenToggle = onToggleCanvasFullscreen
    ? () => onToggleCanvasFullscreen(cardId)
    : undefined
  const ORGANIZATION_EDITOR_HREF = "/organization?view=editor&tab=company"

  return (
    <div className="h-full min-h-0 w-full min-w-0">
      <WorkspaceBoardCardFrame
        cardId={cardId}
        title={cardMeta.title}
        subtitle={cardMeta.subtitle}
        hideTitle={hideHeaderTitle}
        hideSubtitle={hideHeaderSubtitle}
        size={size}
        presentationMode={presentationMode}
        onSizeChange={(nextSize) => onSizeChange(cardId, nextSize)}
        fullHref={cardMeta.fullHref}
        canEdit={canEdit}
        editorHref={canEdit && cardId === "organization-overview" ? ORGANIZATION_EDITOR_HREF : null}
        isCanvasFullscreen={isCanvasFullscreen}
        onToggleCanvasFullscreen={handleFullscreenToggle}
      >
        {cardId === "organization-overview" ? (
          <OrganizationOverviewCard size={size} seed={seed} presentationMode={presentationMode} />
        ) : null}
        {cardId === "formation-status" ? (
          <WorkspaceAcceleratorCardPanel
            input={{
              steps: seed.acceleratorTimeline ?? [],
              mode: tracker.tab === "objectives" ? "tasks" : "setup",
              tasks: tracker.tickets
                .filter((ticket) => !ticket.archived)
                .slice(0, 24)
                .map((ticket) => ({
                  id: ticket.id,
                  title: ticket.title,
                  status: ticket.status,
                  priority: ticket.priority,
                  dueAt: ticket.dueAt,
                })),
              allowTaskUpdates: canEdit && !presentationMode && !isCanvasFullscreen,
              onTaskStatusToggle: (taskId) => {
                if (!canEdit || presentationMode || isCanvasFullscreen) return
                const nowIso = new Date().toISOString()
                onTrackerChange({
                  ...tracker,
                  tickets: tracker.tickets.map((ticket) =>
                    ticket.id === taskId
                      ? {
                          ...ticket,
                          status: resolveNextTrackerStatus(ticket.status),
                          updatedAt: nowIso,
                        }
                      : ticket,
                  ),
                })
              },
              size,
              allowAutoResize: canEdit && !presentationMode && !isCanvasFullscreen,
              storageKey: `${seed.orgId}:${seed.viewerId}`,
              onSizeChange: (nextSize) => onSizeChange(cardId, nextSize),
            }}
          />
        ) : null}
        {cardId === "brand-kit" ? <BrandKitCard size={size} seed={seed} presentationMode={presentationMode} /> : null}
        {cardId === "economic-engine" ? (
          <EconomicEngineCard
            size={size}
            seed={seed}
            presentationMode={presentationMode}
          />
        ) : null}
        {cardId === "calendar" ? (
          <WorkspaceBoardCalendarCard
            calendar={seed.calendar}
            canEdit={canEdit}
            formationStatus={seed.initialProfile.formationStatus ?? null}
            cardSize={size}
            isCanvasFullscreen={isCanvasFullscreen}
            presentationMode={presentationMode}
          />
        ) : null}
        {cardId === "communications" ? (
          <WorkspaceBoardCommunicationsCard
            canEdit={canEdit}
            presentationMode={presentationMode}
            cardSize={size}
            isCanvasFullscreen={isCanvasFullscreen}
            communications={communications}
            onChange={onCommunicationsChange}
          />
        ) : null}
        {cardId === "deck" ? (
          <WorkspaceBoardDeckCard size={size} presentationMode={presentationMode} />
        ) : null}
        {cardId === "vault" ? (
          <WorkspaceBoardVaultCard size={size} presentationMode={presentationMode} />
        ) : null}
        {cardId === "atlas" ? (
          <WorkspaceBoardAtlasCard size={size} presentationMode={presentationMode} />
        ) : null}
      </WorkspaceBoardCardFrame>
    </div>
  )
}, workspaceBoardCardPropsEqual)

WorkspaceBoardCard.displayName = "WorkspaceBoardCard"

export const WorkspaceBoardNode = memo(function WorkspaceBoardNode({
  data,
}: NodeProps<WorkspaceBoardNodeData>) {
  return (
    <>
      <WorkspaceBoardCard data={data} />
      <ConnectionHandles presentationMode={data.presentationMode} />
    </>
  )
})

WorkspaceBoardNode.displayName = "WorkspaceBoardNode"

export function workspaceNodeClassName(_size: WorkspaceCardSize) {
  return "h-full select-none will-change-transform"
}
