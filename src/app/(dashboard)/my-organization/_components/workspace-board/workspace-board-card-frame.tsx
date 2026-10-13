"use client"

import Link from "next/link"
import ExpandIcon from "lucide-react/dist/esm/icons/expand"
import MoreVerticalIcon from "lucide-react/dist/esm/icons/more-vertical"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import type { WorkspaceCardFrameProps } from "./workspace-board-types"

export function WorkspaceBoardCardFrame({
  cardId,
  title,
  subtitle,
  hideTitle = false,
  hideSubtitle = false,
  size,
  presentationMode,
  onSizeChange: _onSizeChange,
  fullHref,
  canEdit,
  editorHref = null,
  isCanvasFullscreen = false,
  onToggleCanvasFullscreen,
  children,
}: WorkspaceCardFrameProps) {
  const showCanvasFullscreenAction = Boolean(onToggleCanvasFullscreen)
  const showEditorAction = Boolean(editorHref)
  const showOverflowMenu = !isCanvasFullscreen && (showCanvasFullscreenAction || showEditorAction)
  const showTitle = !hideTitle
  const showSubtitle = !hideSubtitle && subtitle.trim().length > 0
  const showHeaderCopy = showTitle || showSubtitle

  return (
    <Card
      data-workspace-card={cardId}
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden bg-card/95",
        isCanvasFullscreen
          ? "h-full rounded-none border-0 bg-card shadow-none"
          : ["h-full border border-border/70 shadow-none", size === "sm" ? "rounded-[20px]" : "rounded-[24px]"],
      )}
    >
      <CardHeader
        className={cn(
          "px-4 pb-2 pt-3",
          presentationMode ? "space-y-1.5 px-3.5 pb-1.5 pt-2.5" : "space-y-2",
          !showHeaderCopy && (presentationMode ? "pb-1 pt-2" : "pb-1 pt-2.5"),
          canEdit &&
            !presentationMode &&
            !isCanvasFullscreen &&
            "workspace-card-drag-handle cursor-grab select-none active:cursor-grabbing",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          {showHeaderCopy ? (
            <div className={cn("min-w-0 flex-1 space-y-0.5", presentationMode && "space-y-0")}>
              {showTitle ? (
                <CardTitle className={cn("truncate text-sm font-semibold tracking-tight", presentationMode && "text-[13px]")}>
                  {title}
                </CardTitle>
              ) : null}
              {showSubtitle ? (
                <p className={cn("line-clamp-1 text-[11px] text-muted-foreground", presentationMode && "text-[10px]")}>
                  {subtitle}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="min-w-0 flex-1" aria-hidden />
          )}
          <div className="nodrag nopan flex items-center gap-1">
            {showOverflowMenu ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="nodrag nopan h-7 w-7"
                    aria-label="Card options"
                  >
                    <MoreVerticalIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="nodrag nopan w-44 p-2">
                  <div className="grid gap-1">
                    {showCanvasFullscreenAction ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="nodrag nopan h-8 justify-start"
                        onClick={onToggleCanvasFullscreen}
                      >
                        <ExpandIcon className="h-3.5 w-3.5" aria-hidden />
                        Open fullscreen
                      </Button>
                    ) : null}
                    {showEditorAction ? (
                      <Button asChild variant="ghost" size="sm" className="nodrag nopan h-8 justify-start">
                        <Link href={editorHref as string}>
                          <ExpandIcon className="h-3.5 w-3.5" aria-hidden />
                          Open editor
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </PopoverContent>
              </Popover>
            ) : null}

            {onToggleCanvasFullscreen && isCanvasFullscreen ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="nodrag nopan h-7 px-2 text-[11px]"
                onClick={onToggleCanvasFullscreen}
                aria-label="Close full screen card"
              >
                <XIcon className="h-3.5 w-3.5" aria-hidden />
                Close
              </Button>
            ) : !showOverflowMenu ? (
              <Button asChild type="button" variant="ghost" size="icon" className="nodrag nopan h-7 w-7" aria-label="Open full page">
                <Link href={fullHref}>
                  <ExpandIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "nodrag nopan flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-1",
          cardId === "calendar" ? "pb-3" : cardId === "communications" ? "pb-2" : "pb-4",
          presentationMode && "px-3.5 pb-3 pt-0.5",
          isCanvasFullscreen && "overflow-y-auto px-5 pb-5 pt-2",
        )}
      >
        {children}
      </CardContent>
    </Card>
  )
}
