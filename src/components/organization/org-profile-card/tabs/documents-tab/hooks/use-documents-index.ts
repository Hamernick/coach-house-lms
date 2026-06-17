import { useMemo, useState } from "react"
import { parseAsString, useQueryState } from "nuqs"
import type { OrgDocuments } from "../../../types"
import type {
  DocumentIndexRow,
  DocumentsOption,
  DocumentsPolicyEntry,
  DocumentsRoadmapSection,
  SortColumn,
  SortDirection,
} from "../types"
import {
  buildDocumentsFilterState,
  filterAndSortDocumentRows,
} from "./use-documents-index-filtering"
import {
  DEFAULT_DOCUMENTS_SORT_STATE,
  resolveNextDocumentsSortState,
} from "./documents-index-sort-state"
import {
  buildPolicyRows,
  buildRoadmapRows,
  buildUploadRows,
} from "./use-documents-index-row-builders"

type UseDocumentsIndexArgs = {
  documentsState: OrgDocuments
  policiesState: DocumentsPolicyEntry[]
  policyProgramOptions: DocumentsOption[]
  policyPeopleOptions: DocumentsOption[]
  roadmapSections: DocumentsRoadmapSection[]
}

export function useDocumentsIndex({
  documentsState,
  policiesState,
  policyProgramOptions,
  policyPeopleOptions,
  roadmapSections,
}: UseDocumentsIndexArgs) {
  const [searchQuery, setSearchQuery] = useQueryState(
    "documents_q",
    parseAsString.withDefault("")
  )
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [{ sortColumn, sortDirection }, setSortState] = useState(
    DEFAULT_DOCUMENTS_SORT_STATE
  )

  const programLabelById = useMemo(() => {
    return new Map(
      policyProgramOptions.map((option) => [option.id, option.label])
    )
  }, [policyProgramOptions])

  const peopleLabelById = useMemo(() => {
    return new Map(
      policyPeopleOptions.map((option) => [option.id, option.label])
    )
  }, [policyPeopleOptions])

  const uploadRows = useMemo(() => {
    return buildUploadRows(documentsState)
  }, [documentsState])

  const policyRows = useMemo(() => {
    return buildPolicyRows({
      policiesState,
      programLabelById,
      peopleLabelById,
    })
  }, [peopleLabelById, policiesState, programLabelById])

  const roadmapRows = useMemo(() => {
    return buildRoadmapRows(roadmapSections)
  }, [roadmapSections])

  const hasRoadmapDocuments = roadmapRows.length > 0

  const allRows = useMemo<DocumentIndexRow[]>(() => {
    return [...uploadRows, ...policyRows, ...roadmapRows]
  }, [policyRows, roadmapRows, uploadRows])

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(allRows.flatMap((row) => row.categories))).sort(
      (a, b) => a.localeCompare(b)
    )
  }, [allRows])

  const filterState = useMemo(
    () => buildDocumentsFilterState(activeFilters),
    [activeFilters]
  )
  const { needsAttentionEnabled, updated30dEnabled } = filterState

  const filteredRows = useMemo(() => {
    return filterAndSortDocumentRows({
      rows: allRows,
      filterState,
      searchQuery,
      sortColumn,
      sortDirection,
    })
  }, [allRows, filterState, searchQuery, sortColumn, sortDirection])

  const clearFilters = () => {
    void setSearchQuery("")
    setActiveFilters([])
  }

  const toggleFilter = (token: string) => {
    setActiveFilters((current) => {
      const set = new Set(current)
      if (set.has(token)) set.delete(token)
      else set.add(token)
      return Array.from(set)
    })
  }

  const toggleSortColumn = (column: SortColumn) => {
    setSortState((currentState) =>
      resolveNextDocumentsSortState(currentState, column)
    )
  }

  const handleSortColumnChange = (column: SortColumn) => {
    setSortState((currentState) => ({
      ...currentState,
      sortColumn: column,
    }))
  }

  const handleSortDirectionChange = (direction: SortDirection) => {
    setSortState((currentState) => ({
      ...currentState,
      sortDirection: direction,
    }))
  }

  return {
    activeFilters,
    categoryOptions,
    clearFilters,
    filteredRows,
    handleSortColumnChange,
    handleSortDirectionChange,
    hasRoadmapDocuments,
    needsAttentionEnabled,
    searchQuery,
    setSearchQuery,
    sortColumn,
    sortDirection,
    toggleFilter,
    toggleSortColumn,
    updated30dEnabled,
  }
}
