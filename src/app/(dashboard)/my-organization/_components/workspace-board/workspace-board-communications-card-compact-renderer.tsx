"use client"

import { useState } from "react"
import CircleCheckBigIcon from "lucide-react/dist/esm/icons/circle-check-big"
import Clock3Icon from "lucide-react/dist/esm/icons/clock-3"
import ImageIcon from "lucide-react/dist/esm/icons/image"
import Link2Icon from "lucide-react/dist/esm/icons/link-2"
import PlayIcon from "lucide-react/dist/esm/icons/play"
import SwatchBookIcon from "lucide-react/dist/esm/icons/swatch-book"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type ReturnTypeUseWorkspaceBrandKitController,
  WorkspaceBrandKitCompactTypographyPicker,
} from "@/features/workspace-brand-kit"
import { cn } from "@/lib/utils"

import { WorkspaceBoardActivityHeatmap } from "./workspace-board-activity-heatmap"
import {
  formatCommunicationDateTime,
  titleCaseLabel,
} from "./workspace-board-communications-card-renderers-shared"
import type {
  WorkspaceActivityRecord,
  WorkspaceCommunicationsState,
} from "./workspace-board-types"

function statusCopy(
  status: ReturnTypeUseWorkspaceBrandKitController["readiness"]["status"],
) {
  if (status === "ready") {
    return {
      label: "Ready",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    }
  }
  if (status === "in-progress") {
    return {
      label: "In progress",
      className:
        "border border-border/60 bg-background/80 text-muted-foreground",
    }
  }
  return {
    label: "Needs setup",
    className: "bg-muted text-muted-foreground",
  }
}

function AssetStatus({
  label,
  ready,
  onSelect,
}: {
  label: string
  ready: boolean
  onSelect?: () => void
}) {
  const statusLabel = ready ? "Added" : "Missing"
  const rowContent = (
    <>
      <span className="shrink-0">
        {ready ? (
          <CircleCheckBigIcon className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
        ) : (
          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">{label}</span>
      <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
        {statusLabel}
      </span>
    </>
  )

  if (onSelect) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="h-auto w-full justify-start gap-2 rounded-none px-2.5 py-2 text-left hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring/60"
        onClick={onSelect}
        aria-label={`Open brand kit to manage ${label.toLowerCase()}`}
      >
        {rowContent}
      </Button>
    )
  }

  return <div className="flex w-full items-center gap-2 px-2.5 py-2">{rowContent}</div>
}

function DraftPreview({
  communications,
  connectedChannelsCount,
  compactCanvasPreview,
}: {
  communications: WorkspaceCommunicationsState
  connectedChannelsCount: number
  compactCanvasPreview: boolean
}) {
  const scheduledLabel = formatCommunicationDateTime(communications.scheduledFor)

  return (
    <div className="rounded-2xl border border-border/60 bg-background/35 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Message preview</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-full border-border/60 bg-background/75 px-2 py-0 text-[11px] font-medium"
          >
            {titleCaseLabel(communications.mediaMode)}
          </Badge>
          <span className="rounded-full border border-border/60 bg-background/75 px-2 py-1 text-[11px] text-muted-foreground">
            {connectedChannelsCount}/3 live
          </span>
        </div>
      </div>

      <p
        className={cn(
          "mt-2 text-sm leading-relaxed text-foreground",
          compactCanvasPreview ? "line-clamp-5" : "line-clamp-6",
        )}
      >
        {communications.copy.trim() ||
          "Draft your team update here, then shape it for social, email, or a blog post."}
      </p>

      {communications.mediaMode === "image" ? (
        <div className="mt-3 h-20 rounded-[18px] border border-border/60 bg-muted/45" />
      ) : null}
      {communications.mediaMode === "video" ? (
        <div className="mt-3 grid h-24 place-items-center rounded-[18px] border border-border/60 bg-muted/40">
          <PlayIcon className="h-7 w-7 text-muted-foreground" aria-hidden />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/75 px-2 py-1">
          <Clock3Icon className="h-3.5 w-3.5" aria-hidden />
          {scheduledLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/75 px-2 py-1">
          <Link2Icon className="h-3.5 w-3.5" aria-hidden />
          {titleCaseLabel(communications.channel)}
        </span>
      </div>
    </div>
  )
}

type WorkspaceBoardCommunicationsCompactCardProps = {
  communications: WorkspaceCommunicationsState
  brandController: ReturnTypeUseWorkspaceBrandKitController
  activityFeed: WorkspaceActivityRecord[]
  compactCanvasPreview?: boolean
  onOpenBrandKit?: () => void
  canEdit: boolean
}

export function WorkspaceBoardCommunicationsCompactCard({
  communications,
  brandController,
  activityFeed,
  compactCanvasPreview = false,
  onOpenBrandKit,
  canEdit,
}: WorkspaceBoardCommunicationsCompactCardProps) {
  const [activeTab, setActiveTab] = useState<"scheduler" | "brand-kit">("scheduler")
  const brandStatus = statusCopy(brandController.readiness.status)
  const boilerplate = brandController.draftProfile.boilerplate?.trim() ?? ""
  const palette = brandController.palette.slice(0, 4)
  const connectedChannelsCount = Object.values(communications.connectedChannels).filter(Boolean)
    .length

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "scheduler" | "brand-kit")}
      className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3"
    >
      <TabsList className="inline-flex w-fit items-center rounded-full bg-muted/70 p-1">
        <TabsTrigger
          value="scheduler"
          className="h-7 rounded-full px-3 text-[11px] font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          Scheduler
        </TabsTrigger>
        <TabsTrigger
          value="brand-kit"
          className="h-7 rounded-full px-3 text-[11px] font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          Brand Kit
        </TabsTrigger>
      </TabsList>

      <TabsContent value="scheduler" className="mt-0 min-h-0 outline-none">
        <div className="flex h-full min-h-0 flex-col gap-3">
          <div className="min-h-0 rounded-2xl border border-border/60 bg-background/35 p-3.5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Activity</p>
            </div>
            <WorkspaceBoardActivityHeatmap
              records={activityFeed}
              compact={false}
              className="mt-3"
            />
          </div>

          <DraftPreview
            communications={communications}
            connectedChannelsCount={connectedChannelsCount}
            compactCanvasPreview={compactCanvasPreview}
          />
        </div>
      </TabsContent>

      <TabsContent value="brand-kit" className="mt-0 min-h-0 outline-none">
        <div className="grid h-full min-h-0 grid-rows-[auto_auto_auto_auto] gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/35 px-3.5 py-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  brandStatus.className,
                )}
              >
                {brandStatus.label}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {brandController.readiness.completedCount}/
                {brandController.readiness.totalCount} essentials
              </span>
            </div>
            <div className="flex items-center gap-2">
              <p className="truncate text-[11px] text-muted-foreground">
                {(brandController.themePreset?.label ?? "Custom") + " theme"}
              </p>
              {onOpenBrandKit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full px-3 text-[11px]"
                  onClick={onOpenBrandKit}
                >
                  Open
                </Button>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/35">
            <ul className="divide-y divide-border/60">
              <li>
                <AssetStatus
                  label="Logo"
                  ready={brandController.readiness.hasPrimaryLogo}
                  onSelect={onOpenBrandKit}
                />
              </li>
              <li>
                <AssetStatus
                  label="Mark"
                  ready={brandController.readiness.hasLogoMark}
                  onSelect={onOpenBrandKit}
                />
              </li>
              <li>
                <AssetStatus
                  label="Banner"
                  ready={Boolean(brandController.draftProfile.headerUrl?.trim())}
                  onSelect={onOpenBrandKit}
                />
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/35 p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" aria-hidden />
              Boilerplate
            </div>
            <p
              className={cn(
                "mt-2 text-sm leading-relaxed text-foreground",
                compactCanvasPreview ? "line-clamp-5" : "line-clamp-6",
              )}
            >
              {boilerplate ||
                "Add a short description your team can reuse in flyers, grant packets, public profiles, and partner decks."}
            </p>
          </div>

          <div className="grid gap-3 min-[420px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="rounded-2xl border border-border/60 bg-background/35 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <SwatchBookIcon className="h-3.5 w-3.5" aria-hidden />
                Palette
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {palette.length > 0 ? (
                  palette.map((color) => (
                    <span
                      key={color}
                      className="inline-flex h-6 w-6 rounded-full border border-black/10"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground">Add colors</p>
                )}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {(brandController.themePreset?.label ?? "Custom") +
                  " · " +
                  (brandController.accentPreset?.label ?? "No accent")}
              </p>
            </div>

            <WorkspaceBrandKitCompactTypographyPicker
              controller={brandController}
              canEdit={canEdit}
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
