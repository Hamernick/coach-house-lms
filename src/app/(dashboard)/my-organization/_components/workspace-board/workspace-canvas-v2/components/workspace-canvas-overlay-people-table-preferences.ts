"use client"

import { useCallback, useEffect, useState } from "react"
import type { ColumnSizingState, OnChangeFn } from "@tanstack/react-table"

import {
  buildWorkspaceBoardUiPreferencesStorageKey,
  type WorkspaceBoardUiPreferenceScope,
} from "../../workspace-board-ui-preferences"
import {
  WORKSPACE_PEOPLE_DEFAULT_ROW_HEIGHTS,
  WORKSPACE_PEOPLE_DRAWER_COLUMN_DIMENSIONS,
  clampWorkspacePeopleRowHeight,
  type WorkspacePeopleRowSizing,
  type WorkspacePeopleTableContentMode,
  type WorkspacePeopleTableRowHeight,
} from "./workspace-canvas-overlay-people-table-sizing"

const WORKSPACE_PEOPLE_COLUMN_SIZING_STORAGE_KEY =
  "coachhouse:workspace-people-table:column-sizing:v1"
const WORKSPACE_PEOPLE_SAVED_COLUMN_SIZING_STORAGE_KEY =
  "coachhouse:workspace-people-table:saved-column-sizing:v1"
const WORKSPACE_PEOPLE_ROW_HEIGHT_STORAGE_KEY =
  "coachhouse:workspace-people-table:row-height:v1"
const WORKSPACE_PEOPLE_ROW_SIZING_STORAGE_KEY =
  "coachhouse:workspace-people-table:row-sizing:v1"
const WORKSPACE_PEOPLE_CONTENT_MODE_STORAGE_KEY =
  "coachhouse:workspace-people-table:content-mode:v1"
const WORKSPACE_PEOPLE_LEGACY_MIGRATION_STORAGE_KEY =
  "coachhouse:workspace-people-table:legacy-migration:v2"

const WORKSPACE_PEOPLE_DRAWER_DEFAULT_COLUMN_SIZING = Object.fromEntries(
  Object.entries(WORKSPACE_PEOPLE_DRAWER_COLUMN_DIMENSIONS).map(
    ([columnId, dimensions]) => [columnId, dimensions.size]
  )
)

export type WorkspacePeopleTablePreferences = {
  columnSizing: ColumnSizingState
  contentMode: WorkspacePeopleTableContentMode
  rowHeight: WorkspacePeopleTableRowHeight
  rowSizing: WorkspacePeopleRowSizing
  savedColumnSizing: ColumnSizingState | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function normalizeWorkspacePeopleColumnSizing(
  value: unknown,
  migrateLegacyDefaults = false
): ColumnSizingState {
  const columnSizing = isRecord(value) ? value : {}

  return Object.fromEntries(
    Object.entries(WORKSPACE_PEOPLE_DRAWER_COLUMN_DIMENSIONS).map(
      ([columnId, dimensions]) => {
        const storedCandidate = columnSizing[columnId]
        const candidate =
          migrateLegacyDefaults &&
          columnId === "person" &&
          storedCandidate === 240
            ? dimensions.size
            : storedCandidate
        const width =
          typeof candidate === "number" && Number.isFinite(candidate)
            ? Math.min(
                dimensions.maxSize,
                Math.max(dimensions.minSize, candidate)
              )
            : dimensions.size

        return [columnId, width]
      }
    )
  )
}

function normalizeWorkspacePeopleRowSizing(
  value: unknown
): WorkspacePeopleRowSizing {
  if (!isRecord(value)) return {}

  return Object.fromEntries(
    Object.entries(value).flatMap(([rowId, rowHeight]) =>
      typeof rowHeight === "number" && Number.isFinite(rowHeight)
        ? [[rowId, clampWorkspacePeopleRowHeight(rowHeight)]]
        : []
    )
  )
}

export function normalizeWorkspacePeopleTablePreferences(
  value: unknown,
  migrateLegacyDefaults = false
): WorkspacePeopleTablePreferences {
  const preferences = isRecord(value) ? value : {}
  const rowHeight = preferences.rowHeight

  return {
    columnSizing: normalizeWorkspacePeopleColumnSizing(
      preferences.columnSizing,
      migrateLegacyDefaults
    ),
    contentMode: preferences.contentMode === "truncate" ? "truncate" : "wrap",
    rowHeight:
      rowHeight === "compact" || rowHeight === "spacious"
        ? rowHeight
        : "standard",
    rowSizing: normalizeWorkspacePeopleRowSizing(preferences.rowSizing),
    savedColumnSizing: isRecord(preferences.savedColumnSizing)
      ? normalizeWorkspacePeopleColumnSizing(preferences.savedColumnSizing)
      : null,
  }
}

export function buildWorkspacePeopleTablePreferencesStorageKey(
  scope: WorkspaceBoardUiPreferenceScope
) {
  return `${buildWorkspaceBoardUiPreferencesStorageKey(scope)}:people-table:v2`
}

function readStoredWorkspacePeopleColumnSizing(): ColumnSizingState {
  const rawValue = window.localStorage.getItem(
    WORKSPACE_PEOPLE_COLUMN_SIZING_STORAGE_KEY
  )
  return rawValue
    ? normalizeWorkspacePeopleColumnSizing(JSON.parse(rawValue), true)
    : normalizeWorkspacePeopleColumnSizing(null)
}

function readSavedWorkspacePeopleColumnSizing(): ColumnSizingState | null {
  const rawValue = window.localStorage.getItem(
    WORKSPACE_PEOPLE_SAVED_COLUMN_SIZING_STORAGE_KEY
  )
  return rawValue
    ? normalizeWorkspacePeopleColumnSizing(JSON.parse(rawValue))
    : null
}

function readStoredWorkspacePeopleRowHeight(): WorkspacePeopleTableRowHeight {
  const value = window.localStorage.getItem(
    WORKSPACE_PEOPLE_ROW_HEIGHT_STORAGE_KEY
  )
  return value === "compact" || value === "spacious" ? value : "standard"
}

function readStoredWorkspacePeopleRowSizing(): WorkspacePeopleRowSizing {
  const rawValue = window.localStorage.getItem(
    WORKSPACE_PEOPLE_ROW_SIZING_STORAGE_KEY
  )
  return rawValue ? normalizeWorkspacePeopleRowSizing(JSON.parse(rawValue)) : {}
}

function readStoredWorkspacePeopleContentMode(): WorkspacePeopleTableContentMode {
  return window.localStorage.getItem(
    WORKSPACE_PEOPLE_CONTENT_MODE_STORAGE_KEY
  ) === "truncate"
    ? "truncate"
    : "wrap"
}

function readLegacyWorkspacePeopleTablePreferences(): WorkspacePeopleTablePreferences | null {
  const hasLegacyPreferences = [
    WORKSPACE_PEOPLE_COLUMN_SIZING_STORAGE_KEY,
    WORKSPACE_PEOPLE_SAVED_COLUMN_SIZING_STORAGE_KEY,
    WORKSPACE_PEOPLE_ROW_HEIGHT_STORAGE_KEY,
    WORKSPACE_PEOPLE_ROW_SIZING_STORAGE_KEY,
    WORKSPACE_PEOPLE_CONTENT_MODE_STORAGE_KEY,
  ].some((key) => window.localStorage.getItem(key) !== null)

  if (!hasLegacyPreferences) return null

  return {
    columnSizing: readStoredWorkspacePeopleColumnSizing(),
    contentMode: readStoredWorkspacePeopleContentMode(),
    rowHeight: readStoredWorkspacePeopleRowHeight(),
    rowSizing: readStoredWorkspacePeopleRowSizing(),
    savedColumnSizing: readSavedWorkspacePeopleColumnSizing(),
  }
}

export function readWorkspacePeopleTablePreferences(
  scope: WorkspaceBoardUiPreferenceScope
): WorkspacePeopleTablePreferences {
  const defaults = normalizeWorkspacePeopleTablePreferences(null)
  if (typeof window === "undefined") return defaults

  try {
    const storageKey = buildWorkspacePeopleTablePreferencesStorageKey(scope)
    const rawValue = window.localStorage.getItem(storageKey)
    if (rawValue) {
      return normalizeWorkspacePeopleTablePreferences(JSON.parse(rawValue))
    }

    const migrationOwner = window.localStorage.getItem(
      WORKSPACE_PEOPLE_LEGACY_MIGRATION_STORAGE_KEY
    )
    if (migrationOwner && migrationOwner !== storageKey) return defaults

    const legacyPreferences = readLegacyWorkspacePeopleTablePreferences()
    if (!legacyPreferences) return defaults

    window.localStorage.setItem(storageKey, JSON.stringify(legacyPreferences))
    window.localStorage.setItem(
      WORKSPACE_PEOPLE_LEGACY_MIGRATION_STORAGE_KEY,
      storageKey
    )
    return legacyPreferences
  } catch {
    return defaults
  }
}

export function writeWorkspacePeopleTablePreferences(
  scope: WorkspaceBoardUiPreferenceScope,
  preferences: WorkspacePeopleTablePreferences
) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(
      buildWorkspacePeopleTablePreferencesStorageKey(scope),
      JSON.stringify(normalizeWorkspacePeopleTablePreferences(preferences))
    )
  } catch {
    // Table preferences still work for this session when storage is unavailable.
  }
}

function patchWorkspacePeopleTablePreferences(
  scope: WorkspaceBoardUiPreferenceScope,
  patch: Partial<WorkspacePeopleTablePreferences>
) {
  writeWorkspacePeopleTablePreferences(scope, {
    ...readWorkspacePeopleTablePreferences(scope),
    ...patch,
  })
}

function storeWorkspacePeopleColumnSizing(
  scope: WorkspaceBoardUiPreferenceScope,
  columnSizing: ColumnSizingState
) {
  patchWorkspacePeopleTablePreferences(scope, { columnSizing })
}

function storeSavedWorkspacePeopleColumnSizing(
  scope: WorkspaceBoardUiPreferenceScope,
  savedColumnSizing: ColumnSizingState
) {
  patchWorkspacePeopleTablePreferences(scope, { savedColumnSizing })
}

function clearSavedWorkspacePeopleColumnSizing(
  scope: WorkspaceBoardUiPreferenceScope
) {
  patchWorkspacePeopleTablePreferences(scope, { savedColumnSizing: null })
}

function storeWorkspacePeopleRowPreferences(
  scope: WorkspaceBoardUiPreferenceScope,
  preferences: Pick<
    WorkspacePeopleTablePreferences,
    "contentMode" | "rowHeight" | "rowSizing"
  >
) {
  patchWorkspacePeopleTablePreferences(scope, preferences)
}

export function useWorkspacePeopleTableSizing({
  orgId,
  viewerId,
}: WorkspaceBoardUiPreferenceScope) {
  const scope = { orgId, viewerId }
  const scopeKey = buildWorkspacePeopleTablePreferencesStorageKey(scope)
  const [contentMode, setContentMode] =
    useState<WorkspacePeopleTableContentMode>("wrap")
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(
    WORKSPACE_PEOPLE_DRAWER_DEFAULT_COLUMN_SIZING
  )
  const [savedColumnSizing, setSavedColumnSizing] =
    useState<ColumnSizingState | null>(null)
  const [rowHeight, setRowHeight] =
    useState<WorkspacePeopleTableRowHeight>("standard")
  const [rowSizing, setRowSizing] = useState<WorkspacePeopleRowSizing>({})
  const [loadedScopeKey, setLoadedScopeKey] = useState<string | null>(null)

  useEffect(() => {
    const preferences = readWorkspacePeopleTablePreferences({ orgId, viewerId })
    setColumnSizing(preferences.columnSizing)
    setSavedColumnSizing(preferences.savedColumnSizing)
    setRowHeight(preferences.rowHeight)
    setRowSizing(preferences.rowSizing)
    setContentMode(preferences.contentMode)
    setLoadedScopeKey(scopeKey)
  }, [orgId, scopeKey, viewerId])

  useEffect(() => {
    if (loadedScopeKey !== scopeKey) return
    const timeoutId = window.setTimeout(
      () => storeWorkspacePeopleColumnSizing({ orgId, viewerId }, columnSizing),
      120
    )
    return () => window.clearTimeout(timeoutId)
  }, [columnSizing, loadedScopeKey, orgId, scopeKey, viewerId])

  useEffect(() => {
    if (loadedScopeKey !== scopeKey) return
    const timeoutId = window.setTimeout(() => {
      storeWorkspacePeopleRowPreferences(
        { orgId, viewerId },
        { contentMode, rowHeight, rowSizing }
      )
    }, 120)
    return () => window.clearTimeout(timeoutId)
  }, [
    contentMode,
    loadedScopeKey,
    orgId,
    rowHeight,
    rowSizing,
    scopeKey,
    viewerId,
  ])

  const handleColumnSizingChange = useCallback<OnChangeFn<ColumnSizingState>>(
    (updater) => {
      setColumnSizing((currentSizing) =>
        typeof updater === "function" ? updater(currentSizing) : updater
      )
    },
    []
  )
  const handleContentModeChange = useCallback(
    (nextContentMode: WorkspacePeopleTableContentMode) => {
      setContentMode(nextContentMode)
    },
    []
  )
  const handleColumnSizeChange = useCallback(
    (columnId: string, size: number) => {
      handleColumnSizingChange((currentSizing) => ({
        ...currentSizing,
        [columnId]: size,
      }))
    },
    [handleColumnSizingChange]
  )
  const handleResetColumnWidths = useCallback(() => {
    setColumnSizing({ ...WORKSPACE_PEOPLE_DRAWER_DEFAULT_COLUMN_SIZING })
  }, [])
  const handleRowHeightChange = useCallback(
    (nextRowHeight: WorkspacePeopleTableRowHeight) => {
      setRowHeight(nextRowHeight)
      setRowSizing({})
    },
    []
  )
  const handleRowSizeChange = useCallback(
    (rowId: string, nextRowHeight: number) => {
      setRowSizing((currentSizing) => ({
        ...currentSizing,
        [rowId]: nextRowHeight,
      }))
    },
    []
  )
  const handleRowSizeReset = useCallback((rowId: string) => {
    setRowSizing((currentSizing) => {
      const nextSizing = { ...currentSizing }
      delete nextSizing[rowId]
      return nextSizing
    })
  }, [])
  const handleSaveLayout = useCallback(() => {
    const nextSavedLayout = { ...columnSizing }
    setSavedColumnSizing(nextSavedLayout)
    storeSavedWorkspacePeopleColumnSizing({ orgId, viewerId }, nextSavedLayout)
  }, [columnSizing, orgId, viewerId])
  const handleApplySavedLayout = useCallback(() => {
    if (!savedColumnSizing) return
    setColumnSizing({ ...savedColumnSizing })
  }, [savedColumnSizing])
  const handleClearSavedLayout = useCallback(() => {
    setSavedColumnSizing(null)
    clearSavedWorkspacePeopleColumnSizing({ orgId, viewerId })
  }, [orgId, viewerId])

  return {
    columnSizing,
    contentMode,
    defaultRowHeight: WORKSPACE_PEOPLE_DEFAULT_ROW_HEIGHTS[rowHeight],
    handleApplySavedLayout,
    handleClearSavedLayout,
    handleColumnSizeChange,
    handleColumnSizingChange,
    handleContentModeChange,
    handleResetColumnWidths,
    handleRowHeightChange,
    handleRowSizeChange,
    handleRowSizeReset,
    handleSaveLayout,
    rowHeight,
    rowSizing,
    savedColumnSizing,
    setColumnSizing,
  }
}
