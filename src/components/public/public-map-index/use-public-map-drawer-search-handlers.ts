"use client"

import { useCallback } from "react"

import type { PublicMapGroupFilterKey } from "./category-filter"
import type { SidebarMode } from "./constants"
import type { PublicMapMemberTab } from "./member-rail"

export function usePublicMapDrawerSearchHandlers({
  setActiveGroup,
  setActiveSnapIndex,
  setDrawerTab,
  setQuery,
  setSidebarMode,
}: {
  setActiveGroup: (group: PublicMapGroupFilterKey) => void
  setActiveSnapIndex: (
    value: 0 | 1 | 2 | ((current: 0 | 1 | 2) => 0 | 1 | 2)
  ) => void
  setDrawerTab: (tab: PublicMapMemberTab) => void
  setQuery: (value: string) => void
  setSidebarMode: (mode: SidebarMode) => void
}) {
  const engageSearch = useCallback(() => {
    setDrawerTab("directory")
    setSidebarMode("search")
    setActiveSnapIndex((current) => (current === 0 ? 1 : current))
  }, [setActiveSnapIndex, setDrawerTab, setSidebarMode])
  const changeQuery = useCallback(
    (value: string) => {
      setQuery(value)
      engageSearch()
    },
    [engageSearch, setQuery]
  )
  const changeGroup = useCallback(
    (group: PublicMapGroupFilterKey) => {
      setActiveGroup(group)
      engageSearch()
    },
    [engageSearch, setActiveGroup]
  )

  return { changeGroup, changeQuery, engageSearch }
}
