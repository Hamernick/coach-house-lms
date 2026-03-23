"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { parseAsString, useQueryState } from "nuqs"

import { WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME } from "@/components/workspace/workspace-tutorial-theme"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { WorkspaceCanvasTutorialStepId } from "@/features/workspace-canvas-tutorial"
import type {
  WorkspaceCardSize,
  WorkspaceVaultViewMode,
} from "./workspace-board-types"
import {
  sourceLabel,
  type VaultDocumentDetail,
  type VaultDocumentIndexItem,
} from "./workspace-board-vault-shared"
import {
  VaultDropzoneSurface,
  VaultMiniViewerSurface,
  VaultModeToolbar,
  VaultSearchSurface,
} from "./workspace-board-vault-surfaces"

type ResolveUrlIntent = "view" | "download"
const WORKSPACE_BOARD_VAULT_TUTORIAL_LOCK_HINT_TIMEOUT_MS = 1800
export const WORKSPACE_BOARD_VAULT_TUTORIAL_LOCK_MESSAGE =
  "We'll go over this later :)"

async function readErrorMessage(response: Response, fallback: string) {
  const payload = await response.json().catch(() => ({}))
  return typeof payload?.error === "string" ? payload.error : fallback
}

export function shouldRenderWorkspaceBoardVaultCardDisplayOnly({
  tutorialStepId,
}: {
  presentationMode: boolean
  tutorialStepId?: WorkspaceCanvasTutorialStepId | null
}) {
  return tutorialStepId === "roadmap"
}

function WorkspaceBoardVaultTutorialInteractionShield() {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  const clearOpenTimeout = useCallback(() => {
    if (timeoutRef.current === null) return
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }, [])

  const showHint = useCallback(() => {
    clearOpenTimeout()
    setOpen(true)
    timeoutRef.current = window.setTimeout(() => {
      setOpen(false)
      timeoutRef.current = null
    }, WORKSPACE_BOARD_VAULT_TUTORIAL_LOCK_HINT_TIMEOUT_MS)
  }, [clearOpenTimeout])

  const hideHint = useCallback(() => {
    clearOpenTimeout()
    setOpen(false)
  }, [clearOpenTimeout])

  useEffect(() => () => clearOpenTimeout(), [clearOpenTimeout])

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={WORKSPACE_BOARD_VAULT_TUTORIAL_LOCK_MESSAGE}
          className="absolute inset-0 z-20 cursor-help bg-transparent"
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            showHint()
          }}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            showHint()
          }}
          onFocus={showHint}
          onBlur={hideHint}
          onPointerEnter={showHint}
          onPointerLeave={hideHint}
        />
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="center"
        sideOffset={12}
        className={`workspace-tutorial-callout w-52 whitespace-normal text-left ${WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME}`}
      >
        <p className="text-xs leading-tight">{WORKSPACE_BOARD_VAULT_TUTORIAL_LOCK_MESSAGE}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function WorkspaceBoardVaultCard({
  size,
  canEdit,
  presentationMode,
  tutorialStepId = null,
  mode,
  onModeChange,
}: {
  size: WorkspaceCardSize
  canEdit: boolean
  presentationMode: boolean
  tutorialStepId?: WorkspaceCanvasTutorialStepId | null
  mode: WorkspaceVaultViewMode
  onModeChange: (next: WorkspaceVaultViewMode) => void
}) {
  const [items, setItems] = useState<VaultDocumentIndexItem[]>([])
  const [indexBusy, setIndexBusy] = useState(false)
  const [indexError, setIndexError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useQueryState(
    "vault_q",
    parseAsString.withDefault(""),
  )
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [viewerBusy, setViewerBusy] = useState(false)
  const [viewerError, setViewerError] = useState<string | null>(null)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)
  const [detailBusy, setDetailBusy] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detail, setDetail] = useState<VaultDocumentDetail | null>(null)
  const [stagedCount, setStagedCount] = useState(0)

  const isCompactCard = size === "sm" && !presentationMode
  const isDropzoneDisabled = presentationMode || !canEdit
  const tutorialDisplayOnly = shouldRenderWorkspaceBoardVaultCardDisplayOnly({
    presentationMode,
    tutorialStepId,
  })

  const loadIndex = useCallback(async () => {
    setIndexBusy(true)
    setIndexError(null)
    try {
      const response = await fetch("/api/account/workspace-documents-index?limit=64")
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Unable to load workspace documents"),
        )
      }
      const payload = (await response.json()) as { items?: VaultDocumentIndexItem[] }
      setItems(Array.isArray(payload.items) ? payload.items : [])
    } catch (error: unknown) {
      setIndexError(
        error instanceof Error ? error.message : "Unable to load workspace documents",
      )
    } finally {
      setIndexBusy(false)
    }
  }, [])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId],
  )

  const resetViewerSelection = useCallback(() => {
    setSelectedItemId(null)
    setViewerBusy(false)
    setViewerError(null)
    setViewerUrl(null)
    setDetailBusy(false)
    setDetailError(null)
    setDetail(null)
  }, [])

  const handleCloseViewer = useCallback(() => {
    resetViewerSelection()
    onModeChange("search")
  }, [onModeChange, resetViewerSelection])

  const handleToolbarModeChange = useCallback(
    (next: WorkspaceVaultViewMode) => {
      if (mode === "mini-viewer" && next !== "mini-viewer") {
        resetViewerSelection()
      }
      onModeChange(next)
    },
    [mode, onModeChange, resetViewerSelection],
  )

  const matches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (query.length === 0) return items
    return items.filter((item) => {
      const text = [
        item.title,
        item.subtitle ?? "",
        item.summary ?? "",
        sourceLabel(item.source),
      ].join(" ")
      return text.toLowerCase().includes(query)
    })
  }, [items, searchQuery])
  const visibleMatches = matches
  const hiddenMatchesCount = Math.max(0, matches.length - visibleMatches.length)

  const resolveItemUrl = useCallback(
    async (item: VaultDocumentIndexItem, intent: ResolveUrlIntent) => {
      if (item.source === "upload" && item.documentKind) {
        const search = new URLSearchParams({ kind: item.documentKind })
        if (intent === "download") search.set("download", "1")
        const response = await fetch(`/api/account/org-documents?${search.toString()}`)
        if (!response.ok) {
          throw new Error(await readErrorMessage(response, "Unable to open document"))
        }
        const payload = (await response.json()) as { url?: string }
        if (!payload.url) throw new Error("Unable to open document")
        return payload.url
      }

      if (item.source === "policy" && item.policyId) {
        const search = new URLSearchParams({ id: item.policyId })
        if (intent === "download") search.set("download", "1")
        const response = await fetch(
          `/api/account/org-policies/document?${search.toString()}`,
        )
        if (!response.ok) {
          throw new Error(await readErrorMessage(response, "Unable to open policy file"))
        }
        const payload = (await response.json()) as { url?: string }
        if (!payload.url) throw new Error("Unable to open policy file")
        return payload.url
      }

      return null
    },
    [],
  )

  useEffect(() => {
    void loadIndex()
  }, [loadIndex])

  useEffect(() => {
    if (!selectedItemId) return
    if (items.some((item) => item.id === selectedItemId)) return
    setSelectedItemId(null)
  }, [items, selectedItemId])

  useEffect(() => {
    if (mode !== "mini-viewer") return
    if (selectedItemId) return
    onModeChange("search")
  }, [mode, onModeChange, selectedItemId])

  useEffect(() => {
    let canceled = false

    const loadViewerUrl = async () => {
      setViewerError(null)
      setViewerUrl(null)
      if (!selectedItem) return
      if (selectedItem.source !== "upload" && selectedItem.source !== "policy") return
      const mime = (selectedItem.mime ?? "").toLowerCase()
      const canPreviewPdf = mime === "application/pdf" || mime.length === 0
      if (!canPreviewPdf) return

      setViewerBusy(true)
      try {
        const url = await resolveItemUrl(selectedItem, "view")
        if (!canceled) setViewerUrl(url)
      } catch (error: unknown) {
        if (!canceled) {
          setViewerError(
            error instanceof Error ? error.message : "Unable to open document",
          )
        }
      } finally {
        if (!canceled) setViewerBusy(false)
      }
    }

    void loadViewerUrl()
    return () => {
      canceled = true
    }
  }, [resolveItemUrl, selectedItem])

  useEffect(() => {
    let canceled = false
    setDetailError(null)
    setDetail(null)
    setDetailBusy(false)

    if (!selectedItem) return
    if (selectedItem.source !== "roadmap" && selectedItem.source !== "note") return

    const loadDetail = async () => {
      setDetailBusy(true)
      try {
        const search = new URLSearchParams({ id: selectedItem.id })
        const response = await fetch(
          `/api/account/workspace-documents-index/item?${search.toString()}`,
        )
        if (!response.ok) {
          throw new Error(await readErrorMessage(response, "Unable to load item preview"))
        }
        const payload = (await response.json()) as { detail?: VaultDocumentDetail }
        if (!canceled) setDetail(payload.detail ?? null)
      } catch (error: unknown) {
        if (!canceled) {
          setDetailError(
            error instanceof Error ? error.message : "Unable to load item preview",
          )
        }
      } finally {
        if (!canceled) setDetailBusy(false)
      }
    }

    void loadDetail()
    return () => {
      canceled = true
    }
  }, [selectedItem])

  const handleOpenSelected = useCallback(async () => {
    if (!selectedItem) return
    try {
      if (selectedItem.source === "upload" || selectedItem.source === "policy") {
        const url = await resolveItemUrl(selectedItem, "view")
        if (!url) return
        window.open(url, "_blank", "noopener")
        return
      }
      if (selectedItem.href) {
        window.open(selectedItem.href, "_blank", "noopener")
      }
    } catch (error: unknown) {
      setViewerError(error instanceof Error ? error.message : "Unable to open item")
    }
  }, [resolveItemUrl, selectedItem])

  const handleDownloadSelected = useCallback(async () => {
    if (!selectedItem) return
    if (selectedItem.source !== "upload" && selectedItem.source !== "policy") return
    try {
      const url = await resolveItemUrl(selectedItem, "download")
      if (!url) return
      window.open(url, "_blank", "noopener")
    } catch (error: unknown) {
      setViewerError(
        error instanceof Error ? error.message : "Unable to download document",
      )
    }
  }, [resolveItemUrl, selectedItem])

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      inert={tutorialDisplayOnly || undefined}
    >
      <VaultModeToolbar
        mode={mode}
        isCompactCard={isCompactCard}
        onModeChange={handleToolbarModeChange}
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        {mode === "dropzone" ? (
          <VaultDropzoneSurface
            isDropzoneDisabled={isDropzoneDisabled}
            stagedCount={stagedCount}
            isCompactCard={isCompactCard}
            onDropAccepted={(filesCount) =>
              setStagedCount((current) => current + filesCount)
            }
          />
        ) : null}

        {mode === "search" ? (
          <VaultSearchSurface
            indexBusy={indexBusy}
            indexError={indexError}
            searchQuery={searchQuery}
            visibleMatches={visibleMatches}
            hiddenMatchesCount={hiddenMatchesCount}
            onRetry={() => void loadIndex()}
            onSearchChange={(next) => {
              void setSearchQuery(next)
            }}
            onSelectResult={(itemId) => {
              setSelectedItemId(itemId)
              onModeChange("mini-viewer")
            }}
          />
        ) : null}

        {mode === "mini-viewer" ? (
          <VaultMiniViewerSurface
            isCompactCard={isCompactCard}
            selectedItem={selectedItem}
            viewerBusy={viewerBusy}
            viewerUrl={viewerUrl}
            viewerError={viewerError}
            detailBusy={detailBusy}
            detail={detail}
            detailError={detailError}
            onCloseViewer={handleCloseViewer}
            onOpenSelected={() => void handleOpenSelected()}
            onDownloadSelected={() => void handleDownloadSelected()}
          />
        ) : null}
      </div>
      {tutorialDisplayOnly ? <WorkspaceBoardVaultTutorialInteractionShield /> : null}
    </div>
  )
}
