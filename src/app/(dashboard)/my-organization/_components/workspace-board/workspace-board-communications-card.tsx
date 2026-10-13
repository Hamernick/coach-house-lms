"use client"
import { useEffect, useMemo, useTransition } from "react"
import {
  createWorkspaceCommunicationPostAction,
  processWorkspaceCommunicationDeliveryQueueAction,
} from "../../_lib/workspace-communications-actions"
import { setWorkspaceCommunicationChannelConnectionAction } from "../../_lib/workspace-communications-channel-connections-actions"
import { toast } from "@/lib/toast"
import type {
  WorkspaceCommunicationChannel,
  WorkspaceCommunicationMediaMode,
  WorkspaceCardSize,
  WorkspaceCommunicationsState,
} from "./workspace-board-types"
import {
  buildHeatmapKeyFromDate,
  buildHeatmapRows,
  pruneActivityByDay,
  sortActivityEntriesByDay,
  toLocalDateTimeInputValue,
} from "./workspace-board-communications-card-helpers"
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
  onChange,
}: {
  canEdit: boolean
  presentationMode?: boolean
  cardSize?: WorkspaceCardSize
  isCanvasFullscreen?: boolean
  communications: WorkspaceCommunicationsState
  onChange: (next: WorkspaceCommunicationsState) => void
}) {
  const scheduledForInput = useMemo(
    () => toLocalDateTimeInputValue(communications.scheduledFor),
    [communications.scheduledFor],
  )
  const [isPublishing, startPublishTransition] = useTransition()
  const [isQueueSyncing, startQueueSyncTransition] = useTransition()
  const [isUpdatingConnections, startConnectionTransition] = useTransition()

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

  const heatmapRows = useMemo(() => {
    return buildHeatmapRows(communications.activityByDay)
  }, [communications.activityByDay])

  const recentActivity = useMemo(() => {
    const [latest] = sortActivityEntriesByDay(communications.activityByDay)
    if (!latest) return null
    return latest[1]
  }, [communications.activityByDay])
  const connectedChannelsCount = useMemo(
    () => Object.values(communications.channelConnections).filter((connection) => connection.connected).length,
    [communications.channelConnections],
  )
  const compactCanvasCard = !presentationMode && !isCanvasFullscreen
  const visibleHeatmapRows = compactCanvasCard ? heatmapRows.slice(-4) : heatmapRows

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

  if (presentationMode || compactCanvasCard) {
    return renderCommunicationsPresentationCard({
      communications,
      connectedChannelsCount,
      heatmapRows: compactCanvasCard ? visibleHeatmapRows : heatmapRows,
      recentActivity,
      compactCanvasPreview: compactCanvasCard,
    })
  }

  return renderCommunicationsEditorCard({
    canEdit,
    cardSize,
    compactCanvasCard,
    communications,
    scheduledForInput,
    isQueueSyncing,
    isUpdatingConnections,
    recentActivity,
    visibleHeatmapRows,
    isPublishing,
    setChannelConnected,
    updateMediaMode,
    emulatePublish,
    onChange,
  })
}
