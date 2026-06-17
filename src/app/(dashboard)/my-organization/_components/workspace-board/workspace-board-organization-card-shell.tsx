"use client"

import type { ReactNode } from "react"

import { WorkspaceBoardNodeCardShell } from "./workspace-board-node-card-shell"
import type {
  WorkspaceCardOverflowAction,
  WorkspaceCardSize,
} from "./workspace-board-types"

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
  isCanvasFullscreen?: boolean
  onToggleCanvasFullscreen?: () => void
  children: ReactNode
}) {
  return (
    <WorkspaceBoardNodeCardShell
      cardId="organization-overview"
      title={title}
      subtitle={subtitle}
      headerMeta={headerMeta}
      headerAction={headerAction}
      hideSubtitle
      size={size}
      presentationMode={presentationMode}
      fullHref={fullHref}
      canEdit={canEdit}
      editorHref={editorHref}
      menuActions={menuActions}
      contentClassName={contentClassName}
      isCanvasFullscreen={isCanvasFullscreen}
      onToggleCanvasFullscreen={onToggleCanvasFullscreen}
    >
      {children}
    </WorkspaceBoardNodeCardShell>
  )
}
