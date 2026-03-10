"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { WORKSPACE_CARD_LAYOUT_SYSTEM } from "./workspace-board-card-layout-system"
import { WorkspaceBoardCardHeader } from "./workspace-board-card-header"
import { resolveWorkspaceCardNodeStyle } from "./workspace-board-layout"
import { isWorkspaceNodeAutoHeightCard } from "./workspace-board-node-class-name"
import type { WorkspaceCardFrameProps } from "./workspace-board-types"

export function WorkspaceBoardCardFrame({
  cardId,
  title,
  subtitle,
  tone = "default",
  titleIcon,
  titleBadge,
  headerMeta,
  headerAction,
  hideTitle = false,
  hideSubtitle = false,
  size,
  presentationMode,
  onSizeChange: _onSizeChange,
  fullHref,
  canEdit,
  editorHref = null,
  menuActions = [],
  contentClassName,
  isCanvasFullscreen = false,
  onToggleCanvasFullscreen,
  fullscreenControlMode = "overflow",
  children,
}: WorkspaceCardFrameProps) {
  const canvasNodeStyle = resolveWorkspaceCardNodeStyle(size, cardId)
  const canvasShellStyle = isCanvasFullscreen || isWorkspaceNodeAutoHeightCard(cardId)
    ? undefined
    : {
        minHeight: canvasNodeStyle.minHeight,
        height: canvasNodeStyle.height,
      }

  return (
    <Card
      data-workspace-card={cardId}
      style={canvasShellStyle}
      className={cn(
        "bg-card/95 flex min-h-0 min-w-0 flex-col overflow-visible",
        tone === "accelerator" &&
          "shadow-[0_14px_36px_-30px_rgba(15,23,42,0.18)]",
        isCanvasFullscreen
          ? "bg-card h-full rounded-none border-0 shadow-none"
          : [
              cardId === "accelerator" ||
              cardId === "programs" ||
              cardId === "calendar"
                ? "h-auto shadow-none"
                : "h-full shadow-none",
              "border-border/70 border",
              size === "sm" ? "rounded-[20px]" : "rounded-[24px]",
            ]
      )}
    >
      <WorkspaceBoardCardHeader
        title={title}
        subtitle={subtitle}
        tone={tone}
        titleIcon={titleIcon}
        titleBadge={titleBadge}
        headerMeta={headerMeta}
        headerAction={headerAction}
        hideTitle={hideTitle}
        hideSubtitle={hideSubtitle}
        presentationMode={presentationMode}
        fullHref={fullHref}
        canEdit={canEdit}
        editorHref={editorHref}
        menuActions={menuActions}
        isCanvasFullscreen={isCanvasFullscreen}
        onToggleCanvasFullscreen={onToggleCanvasFullscreen}
        fullscreenControlMode={fullscreenControlMode}
      />
      <CardContent
        className={cn(
          "nodrag nopan overflow-hidden px-4",
          WORKSPACE_CARD_LAYOUT_SYSTEM.flexColumn,
          cardId === "organization-overview" ? "pt-0" : "pt-1",
          cardId === "calendar" ? "pb-3" : "pb-4",
          presentationMode && "px-3.5 pt-0.5 pb-3",
          isCanvasFullscreen &&
            (cardId === "vault"
              ? "overflow-hidden px-0 pt-0 pb-0"
              : "overflow-y-auto px-5 pt-2 pb-5"),
          contentClassName
        )}
      >
        {children}
      </CardContent>
    </Card>
  )
}
