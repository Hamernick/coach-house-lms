"use client"

import PlayIcon from "lucide-react/dist/esm/icons/play"

import { cn } from "@/lib/utils"

import { WORKSPACE_CARD_LAYOUT_SYSTEM } from "./workspace-board-card-layout-system"
import type {
  WorkspaceActivityRecord,
  WorkspaceCommunicationsState,
} from "./workspace-board-types"
import { WorkspaceBoardActivityHeatmap } from "./workspace-board-activity-heatmap"
import {
  CHANNEL_OPTIONS,
  formatCommunicationDateTime,
  titleCaseLabel,
} from "./workspace-board-communications-card-renderers-shared"

export function renderCommunicationsPresentationCard({
  communications,
  connectedChannelsCount,
  activityFeed,
  compactCanvasPreview = false,
}: {
  communications: WorkspaceCommunicationsState
  connectedChannelsCount: number
  activityFeed: WorkspaceActivityRecord[]
  compactCanvasPreview?: boolean
}) {
  const activeChannelConnection = communications.channelConnections[communications.channel]

  if (compactCanvasPreview) {
    return (
      <div className={cn(WORKSPACE_CARD_LAYOUT_SYSTEM.flexColumn, "h-full gap-1.5")}>
        {communications.mediaMode === "image" ? (
          <div className="h-14 rounded-lg bg-muted/35 ring-1 ring-border/40" aria-hidden />
        ) : null}
        {communications.mediaMode === "video" ? (
          <div className="grid h-16 place-items-center rounded-lg bg-muted/30 ring-1 ring-border/40" aria-hidden>
            <PlayIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : null}

        <div
          className={cn(
            WORKSPACE_CARD_LAYOUT_SYSTEM.flexColumn,
            "rounded-lg border border-border/50 bg-background/25 p-2",
          )}
        >
          <p className="mb-1 text-[11px] text-muted-foreground">Activity</p>
          <WorkspaceBoardActivityHeatmap records={activityFeed} compact />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(WORKSPACE_CARD_LAYOUT_SYSTEM.flexColumn, "h-full", compactCanvasPreview ? "gap-2" : "gap-3")}>
      <div className={cn("rounded-xl border border-border/60 bg-background/25", compactCanvasPreview ? "p-2.5" : "p-3")}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Active draft</p>
            <p className="truncate text-sm font-semibold text-foreground">
              {titleCaseLabel(communications.channel)} · {titleCaseLabel(communications.mediaMode)}
            </p>
          </div>
          <span className="inline-flex h-6 items-center rounded-md border border-border/60 bg-background/70 px-2 text-[11px] text-muted-foreground">
            {connectedChannelsCount}/3 connected
          </span>
        </div>

        <div
          className={cn(
            "mt-2 rounded-lg border border-border/60 bg-card p-3",
            compactCanvasPreview && "p-2.5",
            communications.mediaMode === "video" && "min-h-[160px]",
            communications.mediaMode === "image" && "min-h-[136px]",
            compactCanvasPreview && communications.mediaMode === "video" && "min-h-[104px]",
            compactCanvasPreview && communications.mediaMode === "image" && "min-h-[84px]",
          )}
        >
          <p
            className={cn(
              WORKSPACE_CARD_LAYOUT_SYSTEM.textWrap,
              "leading-relaxed text-foreground",
              compactCanvasPreview ? "line-clamp-2 text-xs" : "text-sm",
            )}
          >
            {communications.copy.trim() || "No draft copy yet"}
          </p>
          {communications.mediaMode === "image" ? (
            <div className={cn("mt-3 rounded-[12px] border border-border/60 bg-muted/60", compactCanvasPreview ? "h-14" : "h-24")} />
          ) : null}
          {communications.mediaMode === "video" ? (
            <div className={cn("mt-3 grid place-items-center rounded-[14px] border border-border/60 bg-muted/50", compactCanvasPreview ? "h-16" : "h-28")}>
              <PlayIcon className={cn("text-muted-foreground", compactCanvasPreview ? "h-5 w-5" : "h-7 w-7")} aria-hidden />
            </div>
          ) : null}
        </div>
      </div>

      {!compactCanvasPreview ? (
        <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-border/60 bg-background/20 p-2">
          {CHANNEL_OPTIONS.map((option) => {
            const Icon = option.icon
            const connection = communications.channelConnections[option.id]
            const isActive = communications.channel === option.id
            return (
              <div
                key={`present-connected-${option.id}`}
                className={cn(
                  "rounded-md border bg-background/70 px-2 py-1.5",
                  isActive ? "border-foreground/20" : "border-border/50",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={cn("h-3.5 w-3.5", !connection?.connected && "opacity-45")} aria-hidden />
                  <p className="text-[11px] text-foreground">{option.label}</p>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground/80">
                  {connection?.connected ? connection.provider ?? "Connected" : "Disconnected"}
                </p>
              </div>
            )
          })}
        </div>
      ) : null}

      <div className={cn("rounded-xl border border-border/60 bg-background/20", compactCanvasPreview ? "p-2.5" : "p-3")}>
        <div className={cn("flex items-center justify-between gap-2", compactCanvasPreview ? "mb-1.5" : "mb-2")}>
          <p className={cn("text-muted-foreground", compactCanvasPreview ? "text-[11px]" : "text-xs")}>Workspace activity</p>
        </div>
        <WorkspaceBoardActivityHeatmap records={activityFeed} compact={compactCanvasPreview} />
        <div className={cn("mt-2 grid gap-2 text-[11px] text-muted-foreground", compactCanvasPreview ? "grid-cols-1" : "grid-cols-2")}>
          <div className="rounded-md border border-border/50 bg-background/60 px-2 py-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Next schedule</p>
            <p className="mt-0.5 truncate text-[11px] text-foreground">
              {formatCommunicationDateTime(communications.scheduledFor)}
            </p>
          </div>
          <div className="rounded-md border border-border/50 bg-background/60 px-2 py-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Selected channel</p>
            <p className="mt-0.5 truncate text-[11px] text-foreground">
              {titleCaseLabel(communications.channel)}
              {activeChannelConnection?.connected ? " · connected" : " · disconnected"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
