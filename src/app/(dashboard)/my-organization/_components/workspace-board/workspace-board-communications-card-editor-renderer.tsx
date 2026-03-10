"use client"

import CheckCheckIcon from "lucide-react/dist/esm/icons/check-check"
import Clock3Icon from "lucide-react/dist/esm/icons/clock-3"
import PlayIcon from "lucide-react/dist/esm/icons/play"
import SendIcon from "lucide-react/dist/esm/icons/send"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type {
  WorkspaceActivityRecord,
  WorkspaceCommunicationChannel,
  WorkspaceCommunicationMediaMode,
  WorkspaceCardSize,
  WorkspaceCommunicationsState,
} from "./workspace-board-types"
import { toIsoFromLocalInputValue } from "./workspace-board-communications-card-helpers"
import { WorkspaceBoardActivityHeatmap } from "./workspace-board-activity-heatmap"
import {
  CHANNEL_OPTIONS,
  MEDIA_OPTIONS,
} from "./workspace-board-communications-card-renderers-shared"

export function renderCommunicationsEditorCard({
  canEdit,
  cardSize,
  compactCanvasCard,
  communications,
  scheduledForInput,
  isQueueSyncing,
  isUpdatingConnections,
  activityFeed,
  isPublishing,
  setChannelConnected,
  updateMediaMode,
  emulatePublish,
  onChange,
}: {
  canEdit: boolean
  cardSize: WorkspaceCardSize
  compactCanvasCard: boolean
  communications: WorkspaceCommunicationsState
  scheduledForInput: string
  isQueueSyncing: boolean
  isUpdatingConnections: boolean
  activityFeed: WorkspaceActivityRecord[]
  isPublishing: boolean
  setChannelConnected: (channel: WorkspaceCommunicationChannel, checked: boolean) => void
  updateMediaMode: (mediaMode: WorkspaceCommunicationMediaMode) => void
  emulatePublish: (mode: "now" | "schedule") => void
  onChange: (next: WorkspaceCommunicationsState) => void
}) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", compactCanvasCard ? "gap-2 overflow-y-auto pr-0.5" : "gap-3.5")}>
      <Tabs
        value={communications.channel}
        onValueChange={(value) => {
          if (!canEdit) return
          onChange({
            ...communications,
            channel: value as WorkspaceCommunicationChannel,
          })
        }}
      >
        <TabsList className={cn("grid w-full grid-cols-3", compactCanvasCard ? "h-[30px]" : "h-8")}>
          {CHANNEL_OPTIONS.map((option) => {
            const Icon = option.icon
            const connected = communications.channelConnections[option.id]?.connected
            return (
              <TabsTrigger
                key={option.id}
                value={option.id}
                className={cn("gap-1.5 px-1 text-xs", compactCanvasCard ? "h-[26px]" : "h-7")}
              >
                <Icon className={cn("h-3.5 w-3.5", !connected && "opacity-45")} aria-hidden />
                <span>{option.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      <div className={cn("grid grid-cols-3 gap-1.5", compactCanvasCard ? "gap-1.5" : "gap-2")}>
        {CHANNEL_OPTIONS.map((option) => (
          <div
            key={`connected-${option.id}`}
            className={cn(
              "flex items-center justify-between rounded-lg bg-muted/20 ring-1 ring-border/40",
              compactCanvasCard ? "px-1.5 py-1" : "px-2 py-1.5",
            )}
          >
            <div className="min-w-0 space-y-0.5">
              <p className="text-[11px] font-medium text-foreground">{option.label}</p>
              <p className="truncate text-[10px] text-muted-foreground">
                {communications.channelConnections[option.id]?.connected
                  ? communications.channelConnections[option.id]?.provider ?? "Connected"
                  : "Disconnected"}
              </p>
            </div>
            <Switch
              checked={communications.channelConnections[option.id]?.connected}
              onCheckedChange={(checked) => setChannelConnected(option.id, checked)}
              disabled={!canEdit || isUpdatingConnections}
              aria-label={`Toggle ${option.label} channel`}
            />
          </div>
        ))}
      </div>

      <div className="border-t border-border/50 pt-3">
        <div className={cn("flex items-center justify-between gap-2", compactCanvasCard ? "mb-1.5" : "mb-2.5")}>
          <p className="text-xs text-muted-foreground">Draft</p>
          <div className="flex items-center gap-1.5">
            {MEDIA_OPTIONS.map((option) => {
              const Icon = option.icon
              const active = communications.mediaMode === option.id
              return (
                <Button
                  key={option.id}
                  type="button"
                  size="icon"
                  variant={active ? "default" : "ghost"}
                  className={cn(compactCanvasCard ? "h-[26px] w-[26px]" : "h-7 w-7")}
                  onClick={() => updateMediaMode(option.id)}
                  aria-label={option.label}
                  disabled={!canEdit}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </Button>
              )
            })}
          </div>
        </div>

        <div
          className={cn(
            "rounded-lg bg-muted/20 p-3 ring-1 ring-border/40",
            compactCanvasCard && "p-2.5",
            communications.mediaMode === "video" && (compactCanvasCard ? "min-h-[128px]" : "min-h-[180px]"),
            communications.mediaMode === "image" && (compactCanvasCard ? "min-h-[104px]" : "min-h-[150px]"),
          )}
        >
          <p className="text-sm leading-relaxed text-foreground">{communications.copy.trim() || "Add content"}</p>
          {communications.mediaMode === "image" ? (
            <div className={cn("mt-3 rounded-[14px] bg-muted/55 ring-1 ring-border/35", compactCanvasCard ? "h-20" : "h-28")} />
          ) : null}
          {communications.mediaMode === "video" ? (
            <div className={cn("mt-3 grid place-items-center rounded-[16px] bg-muted/45 ring-1 ring-border/35", compactCanvasCard ? "h-24" : "h-36")}>
              <PlayIcon className="h-8 w-8 text-muted-foreground" aria-hidden />
            </div>
          ) : null}
        </div>

        <div className={cn("grid gap-2 border-t border-border/40 pt-3", compactCanvasCard ? "mt-2" : "mt-3")}>
          <Label htmlFor="workspace-comms-copy" className="text-xs text-muted-foreground">
            Post copy
          </Label>
          <Textarea
            id="workspace-comms-copy"
            rows={2}
            value={communications.copy}
            onChange={(event) => {
              if (!canEdit) return
              onChange({ ...communications, copy: event.currentTarget.value })
            }}
            placeholder="Share progress, asks, and outcomes..."
            disabled={!canEdit}
          />
          <Label htmlFor="workspace-comms-schedule" className="text-xs text-muted-foreground">
            Schedule
          </Label>
          <Input
            id="workspace-comms-schedule"
            type="datetime-local"
            value={scheduledForInput}
            onChange={(event) => {
              if (!canEdit) return
              onChange({
                ...communications,
                scheduledFor: toIsoFromLocalInputValue(event.currentTarget.value, communications.scheduledFor),
              })
            }}
            disabled={!canEdit}
          />
        </div>
      </div>

      <div className="border-t border-border/50 pt-3">
        <div className={cn("flex items-center justify-between gap-2", compactCanvasCard ? "mb-1.5" : "mb-2")}>
          <p className={cn("text-muted-foreground", compactCanvasCard ? "text-[11px]" : "text-xs")}>
            Workspace activity
            {isQueueSyncing ? " · Syncing queue…" : isUpdatingConnections ? " · Updating channels…" : ""}
          </p>
        </div>

        <div className={cn("rounded-lg bg-muted/20 ring-1 ring-border/40", compactCanvasCard ? "p-2.5" : "p-3")}>
          <WorkspaceBoardActivityHeatmap records={activityFeed} compact={compactCanvasCard} />
          {!compactCanvasCard ? (
            <div className="mt-2 border-t border-border/35 pt-2 text-[11px] text-muted-foreground">
              Darker cells mean heavier activity. Hover a day to see the breakdown.
            </div>
          ) : null}
        </div>
      </div>

      <div className={cn("mt-auto grid grid-cols-2 gap-2", compactCanvasCard && cardSize === "sm" && "grid-cols-1")}>
        <Button
          type="button"
          variant="outline"
          className={cn(compactCanvasCard ? "h-8 text-xs" : "h-9")}
          onClick={() => emulatePublish("schedule")}
          disabled={!canEdit || isPublishing || isQueueSyncing || isUpdatingConnections}
        >
          {isPublishing ? <Clock3Icon className="h-4 w-4 animate-pulse" aria-hidden /> : <Clock3Icon className="h-4 w-4" aria-hidden />}
          Schedule
        </Button>
        <Button
          type="button"
          className={cn(compactCanvasCard ? "h-8 text-xs" : "h-9")}
          onClick={() => emulatePublish("now")}
          disabled={!canEdit || isPublishing || isQueueSyncing || isUpdatingConnections}
        >
          {isPublishing ? (
            <CheckCheckIcon className="h-4 w-4 animate-pulse" aria-hidden />
          ) : communications.channel === "email" ? (
            <SendIcon className="h-4 w-4" aria-hidden />
          ) : (
            <CheckCheckIcon className="h-4 w-4" aria-hidden />
          )}
          Post now
        </Button>
      </div>
    </div>
  )
}
