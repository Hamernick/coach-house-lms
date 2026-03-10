"use client"

import Link from "next/link"
import { type ComponentType, type WheelEvent } from "react"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import SearchIcon from "lucide-react/dist/esm/icons/search"
import UploadCloudIcon from "lucide-react/dist/esm/icons/upload-cloud"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dropzone, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone"
import { cn } from "@/lib/utils"

import type { WorkspaceVaultViewMode } from "./workspace-board-types"
import { WORKSPACE_CARD_LAYOUT_SYSTEM } from "./workspace-board-card-layout-system"
import { VaultMiniViewerBody } from "./workspace-board-vault-mini-viewer-body"
import {
  formatBytes,
  formatDate,
  sourceLabel,
  type VaultDocumentDetail,
  type VaultDocumentIndexItem,
} from "./workspace-board-vault-shared"

const DOCUMENT_ACCEPT = {
  "application/pdf": [".pdf"],
} as const

function stopCanvasWheel(event: WheelEvent<HTMLElement>) {
  event.stopPropagation()
}

export function VaultModeToolbar({
  mode,
  isCompactCard,
  onModeChange,
}: {
  mode: WorkspaceVaultViewMode
  isCompactCard: boolean
  onModeChange: (next: WorkspaceVaultViewMode) => void
}) {
  const modeItems: Array<{
    id: WorkspaceVaultViewMode
    label: string
    icon: ComponentType<{ className?: string }>
  }> = [
    { id: "dropzone", label: "Dropzone", icon: UploadCloudIcon },
    { id: "search", label: "Search", icon: SearchIcon },
  ]

  return (
    <div className="border-b border-border/60 bg-background/60 px-2 py-2">
      <div className="flex items-center px-0.5">
        <div className="bg-muted/70 inline-flex max-w-full items-center rounded-full p-1">
          {modeItems.map((item) => {
            const Icon = item.icon
            const active =
              item.id === "search"
                ? mode === "search" || mode === "mini-viewer"
                : mode === item.id
            return (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant="ghost"
                aria-pressed={active}
                aria-label={`Switch to ${item.label}`}
                className={cn(
                  "h-7 rounded-full px-2 text-[11px] font-medium",
                  isCompactCard ? "gap-1 px-1.5" : "gap-1.5",
                  active
                    ? "bg-background text-foreground shadow-sm hover:bg-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => onModeChange(item.id)}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                <span className={cn("truncate", isCompactCard ? "hidden" : "inline")}>
                  {item.label}
                </span>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function VaultDropzoneSurface({
  isDropzoneDisabled,
  stagedCount,
  isCompactCard,
  onDropAccepted,
}: {
  isDropzoneDisabled: boolean
  stagedCount: number
  isCompactCard: boolean
  onDropAccepted: (filesCount: number) => void
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-1">
      <Dropzone
        accept={DOCUMENT_ACCEPT}
        maxFiles={6}
        disabled={isDropzoneDisabled}
        className={cn(
          "!flex !h-full !min-h-0 !w-full !flex-1 !flex-col rounded-t-none rounded-b-xl border-0 bg-[radial-gradient(120%_120%_at_50%_0%,hsl(var(--muted)/0.55),hsl(var(--background)))] p-0 shadow-none transition-colors hover:bg-[radial-gradient(120%_120%_at_50%_0%,hsl(var(--muted)/0.55),hsl(var(--background)))]",
          isDropzoneDisabled && "cursor-not-allowed opacity-80",
        )}
        onDrop={(acceptedFiles) => {
          if (acceptedFiles.length === 0) return
          onDropAccepted(acceptedFiles.length)
        }}
      >
        <DropzoneEmptyState className="flex h-full min-h-0 w-full flex-1 rounded-b-xl">
          <div
            className={cn(
              WORKSPACE_CARD_LAYOUT_SYSTEM.flexColumn,
              "mx-auto h-full min-h-0 w-full max-w-[30rem] flex-1 items-center justify-center gap-3 px-5 py-6 text-center",
            )}
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground shadow-sm">
              <UploadCloudIcon className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm font-semibold text-foreground">Drop PDF documents</p>
            <p
              className={cn(
                WORKSPACE_CARD_LAYOUT_SYSTEM.textWrap,
                "w-full max-w-[32ch] text-xs leading-relaxed text-muted-foreground",
              )}
            >
              PDF only, up to 15 MB. Assign and finalize documents in the Documents index.
            </p>
            {stagedCount > 0 ? (
              <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                {stagedCount} staged this session
              </Badge>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className={cn("h-8 px-3 text-xs", isCompactCard && "h-7")}
              asChild
            >
              <Link href="/organization/documents">Open Documents</Link>
            </Button>
            {isDropzoneDisabled ? (
              <p className="text-[11px] text-muted-foreground">
                Upload is available for workspace editors only.
              </p>
            ) : null}
          </div>
        </DropzoneEmptyState>
      </Dropzone>
    </div>
  )
}

export function VaultSearchSurface({
  indexBusy,
  indexError,
  searchQuery,
  visibleMatches,
  hiddenMatchesCount,
  onRetry,
  onSearchChange,
  onSelectResult,
}: {
  indexBusy: boolean
  indexError: string | null
  searchQuery: string
  visibleMatches: VaultDocumentIndexItem[]
  hiddenMatchesCount: number
  onRetry: () => void
  onSearchChange: (next: string) => void
  onSelectResult: (itemId: string) => void
}) {
  return (
    <div className="flex h-full flex-col bg-background/70">
      <div className="border-b border-border/60 p-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
            placeholder="Search files, notes, roadmap…"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea
        className="nowheel min-h-0 flex-1"
        onWheelCapture={stopCanvasWheel}
      >
        <div className="flex min-h-full flex-col gap-1 p-2">
          {indexBusy ? (
            <div className="flex min-h-0 flex-1 items-center justify-center text-xs text-muted-foreground">
              <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
              Loading documents…
            </div>
          ) : null}

          {!indexBusy && indexError ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
              <p className="text-xs text-muted-foreground">{indexError}</p>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={onRetry}>
                Retry
              </Button>
            </div>
          ) : null}

          {!indexBusy && !indexError && visibleMatches.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center text-xs text-muted-foreground">
              No matches yet.
            </div>
          ) : null}

          {!indexBusy && !indexError
            ? visibleMatches.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto justify-start rounded-lg border border-border/60 px-2 py-2 text-left"
                  onClick={() => onSelectResult(item.id)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-foreground">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      {sourceLabel(item.source)} · {formatDate(item.updatedAt)}
                    </span>
                  </span>
                </Button>
              ))
            : null}

          {!indexBusy && !indexError && hiddenMatchesCount > 0 ? (
            <p className="px-1 pt-0.5 text-[11px] text-muted-foreground">
              +{hiddenMatchesCount} more in Documents
            </p>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  )
}

export function VaultMiniViewerSurface({
  isCompactCard,
  selectedItem,
  viewerBusy,
  viewerUrl,
  viewerError,
  detailBusy,
  detail,
  detailError,
  onCloseViewer,
  onOpenSelected,
  onDownloadSelected,
}: {
  isCompactCard: boolean
  selectedItem: VaultDocumentIndexItem | null
  viewerBusy: boolean
  viewerUrl: string | null
  viewerError: string | null
  detailBusy: boolean
  detail: VaultDocumentDetail | null
  detailError: string | null
  onCloseViewer: () => void
  onOpenSelected: () => void
  onDownloadSelected: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-background/70">
      <div className="border-b border-border/60 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {selectedItem?.title ?? "No document selected"}
            </p>
            {selectedItem ? (
              <div className="mt-1 flex items-center gap-1.5">
                <Badge variant="outline" className="h-5 rounded-full px-1.5 text-[10px]">
                  {sourceLabel(selectedItem.source)}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {formatDate(selectedItem.updatedAt)}
                </span>
                {formatBytes(selectedItem.sizeBytes) ? (
                  <span className="text-[11px] text-muted-foreground">
                    {formatBytes(selectedItem.sizeBytes)}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn("h-7 w-7", isCompactCard && "h-6 w-6")}
              onClick={onCloseViewer}
              aria-label="Close preview"
            >
              <XIcon className="h-3.5 w-3.5" aria-hidden />
            </Button>
            {selectedItem ? (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className={cn("h-7 w-7", isCompactCard && "h-6 w-6")}
                  onClick={onOpenSelected}
                  aria-label="Open selected item"
                >
                  <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden />
                </Button>
                {selectedItem.source === "upload" || selectedItem.source === "policy" ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className={cn("h-7 w-7", isCompactCard && "h-6 w-6")}
                    onClick={onDownloadSelected}
                    aria-label="Download selected item"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
        {selectedItem?.summary ? (
          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
            {selectedItem.summary}
          </p>
        ) : null}
      </div>

      <div
        className="nowheel relative flex min-h-0 flex-1 items-center justify-center bg-muted/25"
        onWheelCapture={stopCanvasWheel}
      >
        <VaultMiniViewerBody
          selectedItem={selectedItem}
          viewerBusy={viewerBusy}
          viewerUrl={viewerUrl}
          viewerError={viewerError}
          detailBusy={detailBusy}
          detail={detail}
          detailError={detailError}
        />
      </div>
    </div>
  )
}
