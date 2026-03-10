"use client"

import { useEffect, useMemo, useTransition } from "react"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import PencilLineIcon from "lucide-react/dist/esm/icons/pencil-line"

import type { OrgProfile } from "@/components/organization/org-profile-card/types"
import {
  useWorkspaceBrandKitController,
  WorkspaceBrandKitSheet,
} from "@/features/workspace-brand-kit"
import { toast } from "@/lib/toast"
import {
  buildWorkspaceActivityFeedFromCommunicationsOverlay,
  mergeWorkspaceActivityFeeds,
} from "../../_lib/workspace-activity"
import type {
  WorkspaceActivityRecord,
  WorkspaceCommunicationChannel,
  WorkspaceCommunicationMediaMode,
  WorkspaceCardOverflowAction,
  WorkspaceCardSize,
  WorkspaceCommunicationsState,
} from "./workspace-board-types"
import {
  createWorkspaceCommunicationPostAction,
  processWorkspaceCommunicationDeliveryQueueAction,
} from "../../_lib/workspace-communications-actions"
import { setWorkspaceCommunicationChannelConnectionAction } from "../../_lib/workspace-communications-channel-connections-actions"
import {
  buildHeatmapKeyFromDate,
  pruneActivityByDay,
  toLocalDateTimeInputValue,
} from "./workspace-board-communications-card-helpers"
import { WorkspaceBoardCommunicationsCompactCard } from "./workspace-board-communications-card-compact-renderer"
import {
  renderCommunicationsEditorCard,
  renderCommunicationsPresentationCard,
} from "./workspace-board-communications-card-renderers"

export function WorkspaceBoardCommunicationsCard({
  canEdit,
  presentationMode = false,
  cardSize = "md",
  isCanvasFullscreen = false,
  communications,
  activityFeed,
  profile,
  onChange,
  onMenuActionsChange,
}: {
  canEdit: boolean
  presentationMode?: boolean
  cardSize?: WorkspaceCardSize
  isCanvasFullscreen?: boolean
  communications: WorkspaceCommunicationsState
  activityFeed: WorkspaceActivityRecord[]
  profile: OrgProfile
  onChange: (next: WorkspaceCommunicationsState) => void
  onMenuActionsChange?: (actions: WorkspaceCardOverflowAction[]) => void
}) {
  const scheduledForInput = useMemo(
    () => toLocalDateTimeInputValue(communications.scheduledFor),
    [communications.scheduledFor],
  )
  const [isPublishing, startPublishTransition] = useTransition()
  const [isQueueSyncing, startQueueSyncTransition] = useTransition()
  const [isUpdatingConnections, startConnectionTransition] = useTransition()
  const brandController = useWorkspaceBrandKitController({
    profile,
    canEdit,
    presentationMode,
  })
  const { setIsSheetOpen } = brandController
  const brandReadinessCount = brandController.readiness.completedCount

  useEffect(() => {
    if (!canEdit) return

    const syncQueue = () => {
      startQueueSyncTransition(async () => {
        await processWorkspaceCommunicationDeliveryQueueAction({ limit: 24 })
      })
    }

    syncQueue()
    const interval = window.setInterval(syncQueue, 60_000)
    return () => window.clearInterval(interval)
  }, [canEdit, startQueueSyncTransition])

  const mergedActivityFeed = useMemo(
    () =>
      mergeWorkspaceActivityFeeds(
        activityFeed,
        buildWorkspaceActivityFeedFromCommunicationsOverlay(communications.activityByDay),
      ),
    [activityFeed, communications.activityByDay],
  )
  const compactCanvasCard = !presentationMode && !isCanvasFullscreen
  const connectedChannelsCount = useMemo(
    () => Object.values(communications.connectedChannels).filter(Boolean).length,
    [communications.connectedChannels],
  )

  const menuActions = useMemo<WorkspaceCardOverflowAction[]>(() => {
    if (presentationMode) return []
    return [
      {
        id: "communications-edit-brand-kit",
        kind: "callback",
        label: canEdit ? "Edit brand kit" : "View brand kit",
        icon: <PencilLineIcon className="h-3.5 w-3.5" aria-hidden />,
        onSelect: () => setIsSheetOpen(true),
      },
      {
        id: "communications-download-brand-kit",
        kind: "link",
        label: "Download brand kit",
        icon: <DownloadIcon className="h-3.5 w-3.5" aria-hidden />,
        href: "/api/account/org-brand-kit/download",
        target: "_blank",
        disabled: brandReadinessCount === 0,
      },
    ]
  }, [
    brandReadinessCount,
    canEdit,
    presentationMode,
    setIsSheetOpen,
  ])

  useEffect(() => {
    onMenuActionsChange?.(menuActions)
    return () => onMenuActionsChange?.([])
  }, [menuActions, onMenuActionsChange])

  const setChannelConnected = (channel: WorkspaceCommunicationChannel, checked: boolean) => {
    if (!canEdit) return
    startConnectionTransition(async () => {
      const result = await setWorkspaceCommunicationChannelConnectionAction({
        channel,
        connected: checked,
      })
      if ("error" in result) {
        toast.error(result.error)
        return
      }

      onChange({
        ...communications,
        connectedChannels: {
          ...communications.connectedChannels,
          [channel]: result.connection.connected,
        },
        channelConnections: {
          ...communications.channelConnections,
          [channel]: {
            connected: result.connection.connected,
            provider: result.connection.provider,
            connectedAt: result.connection.connectedAt,
            connectedBy: result.connection.connectedBy,
          },
        },
      })
    })
  }

  const updateMediaMode = (mediaMode: WorkspaceCommunicationMediaMode) => {
    if (!canEdit) return
    onChange({
      ...communications,
      mediaMode,
    })
  }

  const emulatePublish = (mode: "now" | "schedule") => {
    if (!canEdit) return
    if (!communications.copy.trim()) {
      toast.error("Add copy before publishing.")
      return
    }
    if (!communications.channelConnections[communications.channel]?.connected) {
      toast.error("Connect this channel before publishing.")
      return
    }

    const now = new Date()
    const scheduleTarget =
      mode === "schedule"
        ? new Date(communications.scheduledFor)
        : now
    const effectiveDate = Number.isFinite(scheduleTarget.getTime()) ? scheduleTarget : now

    startPublishTransition(async () => {
      const result = await createWorkspaceCommunicationPostAction({
        channel: communications.channel,
        mediaMode: communications.mediaMode,
        content: communications.copy.trim(),
        scheduledFor: effectiveDate.toISOString(),
        status: mode === "now" ? "posted" : "scheduled",
      })

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      const timestamp = result.post.postedAt ?? result.post.scheduledFor
      const dayKey = buildHeatmapKeyFromDate(new Date(timestamp))
      const nextActivityByDay = pruneActivityByDay({
        ...communications.activityByDay,
        [dayKey]: {
          status: result.post.status,
          channel: result.post.channel,
          timestamp,
        },
      })

      onChange({
        ...communications,
        activityByDay: nextActivityByDay,
      })

      toast.success(mode === "now" ? "Posted" : "Scheduled")
    })
  }

  return (
    <>
      {presentationMode ? (
        renderCommunicationsPresentationCard({
          communications,
          connectedChannelsCount,
          activityFeed: mergedActivityFeed,
        })
      ) : compactCanvasCard ? (
        <WorkspaceBoardCommunicationsCompactCard
          communications={communications}
          brandController={brandController}
          activityFeed={mergedActivityFeed}
          compactCanvasPreview={compactCanvasCard}
          onOpenBrandKit={() => setIsSheetOpen(true)}
          canEdit={canEdit}
        />
      ) : renderCommunicationsEditorCard({
          canEdit,
          cardSize,
          compactCanvasCard,
          communications,
          scheduledForInput,
          isQueueSyncing,
          isUpdatingConnections,
          activityFeed: mergedActivityFeed,
          isPublishing,
          setChannelConnected,
          updateMediaMode,
          emulatePublish,
          onChange,
        })}
      <WorkspaceBrandKitSheet controller={brandController} canEdit={canEdit} />
    </>
  )
}
