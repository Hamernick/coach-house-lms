import {
  FILTER_CATEGORY_PREFIX,
  FILTER_SOURCE_PREFIX,
  FILTER_SPECIAL_NEEDS_ATTENTION,
  FILTER_SPECIAL_UPDATED_30_DAYS,
  FILTER_STATUS_PREFIX,
  FILTER_VISIBILITY_PREFIX,
} from "../constants"
import type { DocumentSource, DocumentStatus, DocumentVisibility } from "../types"

function tokenValue(token: string, prefix: string) {
  return token.slice(prefix.length)
}

export type DocumentsFilterState = {
  activeCategoryFilters: Set<string>
  activeSourceFilters: Set<DocumentSource>
  activeStatusFilters: Set<DocumentStatus>
  activeVisibilityFilters: Set<DocumentVisibility>
  needsAttentionEnabled: boolean
  updated30dEnabled: boolean
}

export function buildDocumentsFilterState(activeFilters: string[]): DocumentsFilterState {
  const activeSourceFilters = new Set(
    activeFilters
      .filter((token) => token.startsWith(FILTER_SOURCE_PREFIX))
      .map((token) => tokenValue(token, FILTER_SOURCE_PREFIX) as DocumentSource),
  )

  const activeStatusFilters = new Set(
    activeFilters
      .filter((token) => token.startsWith(FILTER_STATUS_PREFIX))
      .map((token) => tokenValue(token, FILTER_STATUS_PREFIX) as DocumentStatus),
  )

  const activeVisibilityFilters = new Set(
    activeFilters
      .filter((token) => token.startsWith(FILTER_VISIBILITY_PREFIX))
      .map((token) => tokenValue(token, FILTER_VISIBILITY_PREFIX) as DocumentVisibility),
  )

  const activeCategoryFilters = new Set(
    activeFilters
      .filter((token) => token.startsWith(FILTER_CATEGORY_PREFIX))
      .map((token) => decodeURIComponent(tokenValue(token, FILTER_CATEGORY_PREFIX))),
  )

  return {
    activeCategoryFilters,
    activeSourceFilters,
    activeStatusFilters,
    activeVisibilityFilters,
    needsAttentionEnabled: activeFilters.includes(FILTER_SPECIAL_NEEDS_ATTENTION),
    updated30dEnabled: activeFilters.includes(FILTER_SPECIAL_UPDATED_30_DAYS),
  }
}
