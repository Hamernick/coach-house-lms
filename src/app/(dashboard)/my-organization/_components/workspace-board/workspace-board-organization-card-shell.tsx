"use client"

import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { WORKSPACE_CARD_LAYOUT_SYSTEM } from "./workspace-board-card-layout-system"
import { WorkspaceBoardCardHeader } from "./workspace-board-card-header"
import {
  resolveWorkspaceCardCanvasShellClassName,
  resolveWorkspaceCardCanvasShellStyle,
} from "./workspace-board-layout-config"
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
  headerAction,
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
  headerAction?: ReactNode
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
  const canvasShellStyle = resolveWorkspaceCardCanvasShellStyle({
    size,
    cardId: "organization-overview",
    isCanvasFullscreen,
  })

  return (
    <Card
      data-workspace-card="organization-overview"
      style={canvasShellStyle}
      className={cn(
        "bg-card/95 flex min-h-0 min-w-0 flex-col overflow-visible",
        resolveWorkspaceCardCanvasShellClassName({
          size,
          cardId: "organization-overview",
          isCanvasFullscreen,
        })
      )}
    >
      <div className="grid min-h-0 min-w-0 grid-cols-1 grid-rows-[auto_auto] md:grid-cols-[64px_minmax(0,1fr)]">
        <aside className="nodrag nopan border-border/70 bg-muted/24 row-span-2 hidden min-h-0 border-r px-2 py-3 md:flex md:flex-col md:items-center">
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
            headerAction={headerAction}
            hideSubtitle
            isCanvasFullscreen={isCanvasFullscreen}
            onToggleCanvasFullscreen={onToggleCanvasFullscreen}
          />
        </div>
        <CardContent
          className={cn(
            "nodrag nopan px-5 pt-0 pb-5 md:col-start-2",
            WORKSPACE_CARD_LAYOUT_SYSTEM.flexColumn,
            presentationMode && "px-4 pt-0.5 pb-3.5",
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
