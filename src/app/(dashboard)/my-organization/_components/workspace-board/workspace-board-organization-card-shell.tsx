"use client"

import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { WORKSPACE_CARD_LAYOUT_SYSTEM } from "./workspace-board-card-layout-system"
import { WorkspaceBoardCardHeader } from "./workspace-board-card-header"
import { resolveWorkspaceCardNodeStyle } from "./workspace-board-layout"
import { isWorkspaceNodeAutoHeightCard } from "./workspace-board-node-class-name"
import type {
  WorkspaceCardOverflowAction,
  WorkspaceCardSize,
} from "./workspace-board-types"
import type { WorkspaceCardShortcutItemModel } from "./workspace-canvas-v2/shortcuts/workspace-card-shortcut-model"
import { WorkspaceOrganizationCardShortcuts } from "./workspace-canvas-v2/shortcuts/workspace-organization-card-shortcuts"

export function WorkspaceBoardOrganizationCardShell({
  title,
  subtitle,
  headerMeta,
  size,
  presentationMode,
  fullHref,
  canEdit,
  editorHref = null,
  menuActions = [],
  contentClassName,
  shortcutItems,
  isCanvasFullscreen = false,
  onToggleCanvasFullscreen,
  children,
}: {
  title: string
  subtitle: string
  headerMeta?: ReactNode
  size: WorkspaceCardSize
  presentationMode: boolean
  fullHref: string
  canEdit: boolean
  editorHref?: string | null
  menuActions?: WorkspaceCardOverflowAction[]
  contentClassName?: string
  shortcutItems: WorkspaceCardShortcutItemModel[]
  isCanvasFullscreen?: boolean
  onToggleCanvasFullscreen?: () => void
  children: ReactNode
}) {
  const canvasNodeStyle = resolveWorkspaceCardNodeStyle(
    size,
    "organization-overview",
  )
  const canvasShellStyle =
    isCanvasFullscreen || isWorkspaceNodeAutoHeightCard("organization-overview")
    ? undefined
    : {
        minHeight: canvasNodeStyle.minHeight,
        height: canvasNodeStyle.height,
      }

  return (
    <Card
      data-workspace-card="organization-overview"
      style={canvasShellStyle}
      className={cn(
        "bg-card/95 flex min-h-0 min-w-0 flex-col overflow-visible",
        isCanvasFullscreen
          ? "bg-card h-full rounded-none border-0 shadow-none"
          : [
              "h-auto shadow-none",
              "border-border/70 border",
              size === "sm" ? "rounded-[20px]" : "rounded-[24px]",
            ]
      )}
    >
      <div className="grid min-h-0 min-w-0 grid-cols-1 grid-rows-[auto_auto] md:grid-cols-[64px_minmax(0,1fr)]">
        <aside className="border-border/70 bg-muted/28 row-span-2 hidden min-h-0 border-r px-3 py-3 md:flex md:flex-col md:items-center">
          <WorkspaceOrganizationCardShortcuts items={shortcutItems} />
        </aside>
        <div className="min-w-0 md:col-start-2">
          <WorkspaceBoardCardHeader
            title={title}
            subtitle={subtitle}
            presentationMode={presentationMode}
            fullHref={fullHref}
            canEdit={canEdit}
            editorHref={editorHref}
            menuActions={menuActions}
            headerMeta={headerMeta}
            hideSubtitle
            isCanvasFullscreen={isCanvasFullscreen}
            onToggleCanvasFullscreen={onToggleCanvasFullscreen}
          />
        </div>
        <CardContent
          className={cn(
            "nodrag nopan px-4 pt-0 pb-4 md:col-start-2",
            WORKSPACE_CARD_LAYOUT_SYSTEM.flexColumn,
            presentationMode && "px-3.5 pt-0.5 pb-3",
            isCanvasFullscreen && "overflow-y-auto px-5 pt-2 pb-5",
            contentClassName,
          )}
        >
          {children}
        </CardContent>
      </div>
    </Card>
  )
}
