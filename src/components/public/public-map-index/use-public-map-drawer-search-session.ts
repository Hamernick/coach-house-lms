"use client"

import { useCallback, useEffect, useState } from "react"

import type { PublicMapGroupFilterKey } from "./category-filter"
import type { SidebarMode } from "./constants"
import type { PublicMapMemberTab } from "./member-rail"
import type { PublicMapSidebarSearchContext } from "./search-panel-content"
import { usePublicMapDrawerSearchHandlers } from "./use-public-map-drawer-search-handlers"

export function usePublicMapDrawerSearchSession({
  activeGroup,
  query,
  searchContext,
  setActiveGroup,
  setActiveSnapIndex,
  setDrawerTab,
  setQuery,
  setSidebarMode,
}: {
  activeGroup: PublicMapGroupFilterKey
  query: string
  searchContext: PublicMapSidebarSearchContext | null
  setActiveGroup: (group: PublicMapGroupFilterKey) => void
  setActiveSnapIndex: (
    value: 0 | 1 | 2 | ((current: 0 | 1 | 2) => 0 | 1 | 2)
  ) => void
  setDrawerTab: (tab: PublicMapMemberTab) => void
  setQuery: (value: string) => void
  setSidebarMode: (mode: SidebarMode) => void
}) {
  const [searchActive, setSearchActive] = useState(
    () => query.trim().length > 0 || activeGroup !== "all"
  )
  const {
    changeGroup: changeGroupBase,
    changeQuery: changeQueryBase,
    engageSearch: engageSearchBase,
  } = usePublicMapDrawerSearchHandlers({
    setActiveGroup,
    setActiveSnapIndex,
    setDrawerTab,
    setQuery,
    setSidebarMode,
  })

  useEffect(() => {
    if (query.trim().length > 0 || activeGroup !== "all" || searchContext) {
      setSearchActive(true)
    }
  }, [activeGroup, query, searchContext])

  const engageSearch = useCallback(() => {
    setSearchActive(true)
    engageSearchBase()
  }, [engageSearchBase])
  const changeQuery = useCallback(
    (value: string) => {
      setSearchActive(true)
      changeQueryBase(value)
    },
    [changeQueryBase]
  )
  const changeGroup = useCallback(
    (group: PublicMapGroupFilterKey) => {
      setSearchActive(true)
      changeGroupBase(group)
    },
    [changeGroupBase]
  )
  const cancelSearch = useCallback(() => {
    searchContext?.onClear()
    setQuery("")
    setActiveGroup("all")
    setDrawerTab("directory")
    setSidebarMode("search")
    setActiveSnapIndex(1)
    setSearchActive(false)
  }, [
    searchContext,
    setActiveGroup,
    setActiveSnapIndex,
    setDrawerTab,
    setQuery,
    setSidebarMode,
  ])

  return { cancelSearch, changeGroup, changeQuery, engageSearch, searchActive }
}
