"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ExpandIcon from "lucide-react/dist/esm/icons/expand"
import Maximize2Icon from "lucide-react/dist/esm/icons/maximize-2"
import Minimize2Icon from "lucide-react/dist/esm/icons/minimize-2"
import MoreVerticalIcon from "lucide-react/dist/esm/icons/more-vertical"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Button } from "@/components/ui/button"
import { CardHeader, CardTitle } from "@/components/ui/card"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import type { WorkspaceCardOverflowAction } from "./workspace-board-types"

export function WorkspaceBoardCardHeader({
  title,
  subtitle,
  tone = "default",
  titleIcon,
  titleBadge,
  headerMeta,
  headerAction,
  hideTitle = false,
  hideSubtitle = false,
  presentationMode,
  fullHref: _fullHref,
  canEdit,
  editorHref = null,
  menuActions = [],
  isCanvasFullscreen = false,
  onToggleCanvasFullscreen,
  fullscreenControlMode = "overflow",
}: {
  title: string
  subtitle: string
  tone?: "default" | "accelerator"
  titleIcon?: ReactNode
  titleBadge?: ReactNode
  headerMeta?: ReactNode
  headerAction?: ReactNode
  hideTitle?: boolean
  hideSubtitle?: boolean
  presentationMode: boolean
  fullHref: string
  canEdit: boolean
  editorHref?: string | null
  menuActions?: WorkspaceCardOverflowAction[]
  isCanvasFullscreen?: boolean
  onToggleCanvasFullscreen?: () => void
  fullscreenControlMode?: "overflow" | "inline"
}) {
  const showCanvasFullscreenAction = Boolean(onToggleCanvasFullscreen)
  const showInlineFullscreenControl =
    showCanvasFullscreenAction && fullscreenControlMode === "inline"
  const showEditorAction = Boolean(editorHref)
  const hasCustomMenuActions = menuActions.length > 0
  const showDirectEditorLink =
    !isCanvasFullscreen && showEditorAction && !hasCustomMenuActions
  const showOverflowMenu =
    !isCanvasFullscreen &&
    !showDirectEditorLink &&
    (
      (showCanvasFullscreenAction && !showInlineFullscreenControl) ||
      showEditorAction ||
      hasCustomMenuActions
    )
  const showTitle = !hideTitle
  const showSubtitle = !hideSubtitle && subtitle.trim().length > 0
  const showHeaderCopy = showTitle || showSubtitle

  return (
    <CardHeader
      className={cn(
        "px-4 pt-3 pb-2",
        presentationMode ? "space-y-1.5 px-3.5 pt-2.5 pb-1.5" : "space-y-2",
        !showHeaderCopy && (presentationMode ? "pt-2 pb-1" : "pt-2.5 pb-1"),
        canEdit &&
          !presentationMode &&
          !isCanvasFullscreen &&
          "workspace-card-drag-handle cursor-grab select-none active:cursor-grabbing"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {showHeaderCopy ? (
          <div
            className={cn(
              "min-w-0 flex-1 space-y-0.5",
              presentationMode && "space-y-0"
            )}
          >
            {showTitle ? (
              <CardTitle
                className={cn(
                  "truncate text-sm font-semibold tracking-tight",
                  presentationMode && "text-[13px]"
                )}
              >
                <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
                  {titleIcon ? (
                    <span
                      className={cn(
                        "shrink-0",
                        tone === "accelerator"
                          ? "inline-flex h-5 w-5 items-center justify-center rounded-[6px]"
                          : "text-muted-foreground"
                      )}
                    >
                      {titleIcon}
                    </span>
                  ) : null}
                  <span className="truncate">{title}</span>
                  {titleBadge ? (
                    <span className="shrink-0">
                      {titleBadge}
                    </span>
                  ) : null}
                </span>
              </CardTitle>
            ) : null}
            {showSubtitle ? (
              <p
                className={cn(
                  "text-muted-foreground line-clamp-1 text-[11px]",
                  presentationMode && "text-[10px]"
                )}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="min-w-0 flex-1" aria-hidden />
        )}
        <div className="nodrag nopan flex items-center gap-1">
          {headerMeta ? <div className="nodrag nopan shrink-0">{headerMeta}</div> : null}
          {headerAction ? <div className="nodrag nopan shrink-0">{headerAction}</div> : null}
          {showDirectEditorLink ? (
            <Button asChild variant="ghost" size="icon" className="nodrag nopan h-7 w-7">
              <Link href={editorHref as string} aria-label="Open card editor">
                <Maximize2Icon className="text-muted-foreground h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          ) : null}
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
                  <MoreVerticalIcon
                    className="text-muted-foreground h-3.5 w-3.5"
                    aria-hidden
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="nodrag nopan w-44 p-2">
                <div className="grid gap-1">
                  {hasCustomMenuActions
                    ? menuActions.map((action) => (
                        action.kind === "callback" ? (
                          <PopoverClose key={action.id} asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="nodrag nopan h-8 justify-start"
                              disabled={action.disabled}
                              onClick={action.onSelect}
                            >
                              {action.icon ?? <span className="h-3.5 w-3.5" aria-hidden />}
                              <span className="min-w-0 flex-1 text-left">{action.label}</span>
                              {action.active ? <CheckIcon className="h-3.5 w-3.5" aria-hidden /> : null}
                            </Button>
                          </PopoverClose>
                        ) : (
                          <PopoverClose key={action.id} asChild>
                            {action.disabled ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="nodrag nopan h-8 justify-start"
                                disabled
                              >
                                {action.icon ?? <span className="h-3.5 w-3.5" aria-hidden />}
                                <span className="min-w-0 flex-1 text-left">{action.label}</span>
                                {action.active ? <CheckIcon className="h-3.5 w-3.5" aria-hidden /> : null}
                              </Button>
                            ) : (
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="nodrag nopan h-8 justify-start"
                              >
                                <Link
                                  href={action.href}
                                  prefetch={false}
                                  target={action.target}
                                  download={action.download}
                                >
                                  {action.icon ?? <span className="h-3.5 w-3.5" aria-hidden />}
                                  <span className="min-w-0 flex-1 text-left">{action.label}</span>
                                  {action.active ? <CheckIcon className="h-3.5 w-3.5" aria-hidden /> : null}
                                </Link>
                              </Button>
                            )}
                          </PopoverClose>
                        )
                      ))
                    : null}
                  {hasCustomMenuActions &&
                  ((showCanvasFullscreenAction && !showInlineFullscreenControl) ||
                    showEditorAction) ? (
                    <div className="bg-border/70 my-1 h-px w-full" />
                  ) : null}
                  {showCanvasFullscreenAction && !showInlineFullscreenControl ? (
                    <PopoverClose asChild>
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
                    </PopoverClose>
                  ) : null}
                  {showEditorAction ? (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="nodrag nopan h-8 justify-start"
                    >
                      <Link href={editorHref as string}>
                        <ExpandIcon className="h-3.5 w-3.5" aria-hidden />
                        Edit
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </PopoverContent>
            </Popover>
          ) : null}

          {showInlineFullscreenControl ? (
            <Button
              type="button"
              size="sm"
              variant={isCanvasFullscreen ? "secondary" : "outline"}
              className="nodrag nopan h-7 w-7 rounded-full px-0"
              onClick={onToggleCanvasFullscreen}
              aria-label={isCanvasFullscreen ? "Exit fullscreen" : "Open fullscreen"}
            >
              {isCanvasFullscreen ? (
                <Minimize2Icon className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Maximize2Icon className="h-3.5 w-3.5" aria-hidden />
              )}
            </Button>
          ) : onToggleCanvasFullscreen && isCanvasFullscreen ? (
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
          ) : null}
        </div>
      </div>
    </CardHeader>
  )
}
