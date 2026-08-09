"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { type PublicMapGroupFilterKey } from "./category-filter"
import {
  buildPublicMapFilterHref,
  resolvePublicMapFilterUrlState,
} from "./filter-url-state"

const PUBLIC_MAP_FILTER_URL_SYNC_DELAY_MS = 150

export function usePublicMapFilterUrlState({
  onFilterChange,
}: {
  onFilterChange: () => void
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialFilterState = resolvePublicMapFilterUrlState(
    new URLSearchParams(searchParams.toString())
  )
  const [query, setQuery] = useState(initialFilterState.query)
  const [activeGroup, setActiveGroup] = useState<PublicMapGroupFilterKey>(
    initialFilterState.activeGroup
  )
  const filterStateRef = useRef(initialFilterState)
  const filterUrlSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  useEffect(() => {
    const nextFilterState = resolvePublicMapFilterUrlState(
      new URLSearchParams(searchParams.toString())
    )
    const changed =
      filterStateRef.current.query !== nextFilterState.query ||
      filterStateRef.current.activeGroup !== nextFilterState.activeGroup

    filterStateRef.current = nextFilterState
    if (!changed) return

    onFilterChange()
    setQuery(nextFilterState.query)
    setActiveGroup(nextFilterState.activeGroup)
  }, [onFilterChange, searchParams])

  useEffect(
    () => () => {
      if (filterUrlSyncTimerRef.current) {
        clearTimeout(filterUrlSyncTimerRef.current)
      }
    },
    []
  )

  const replaceFilterHistory = useCallback(
    ({
      nextActiveGroup,
      nextQuery,
    }: {
      nextActiveGroup: PublicMapGroupFilterKey
      nextQuery: string
    }) => {
      const nextHref = buildPublicMapFilterHref({
        activeGroup: nextActiveGroup,
        pathname,
        query: nextQuery,
        searchParams: new URLSearchParams(searchParams.toString()),
      })
      filterStateRef.current = resolvePublicMapFilterUrlState(
        new URL(nextHref, window.location.origin).searchParams
      )
      window.history.replaceState(window.history.state, "", nextHref)
    },
    [pathname, searchParams]
  )

  const scheduleFilterHistoryReplace = useCallback(
    (nextQuery: string, nextActiveGroup: PublicMapGroupFilterKey) => {
      if (filterUrlSyncTimerRef.current) {
        clearTimeout(filterUrlSyncTimerRef.current)
      }
      filterUrlSyncTimerRef.current = setTimeout(() => {
        filterUrlSyncTimerRef.current = null
        replaceFilterHistory({ nextActiveGroup, nextQuery })
      }, PUBLIC_MAP_FILTER_URL_SYNC_DELAY_MS)
    },
    [replaceFilterHistory]
  )

  const handleQueryChange = useCallback(
    (value: string) => {
      onFilterChange()
      setQuery(value)
      scheduleFilterHistoryReplace(value, activeGroup)
    },
    [activeGroup, onFilterChange, scheduleFilterHistoryReplace]
  )

  const handleActiveGroupChange = useCallback(
    (value: PublicMapGroupFilterKey) => {
      onFilterChange()
      setActiveGroup(value)
      if (filterUrlSyncTimerRef.current) {
        clearTimeout(filterUrlSyncTimerRef.current)
        filterUrlSyncTimerRef.current = null
      }
      replaceFilterHistory({
        nextActiveGroup: value,
        nextQuery: query,
      })
    },
    [onFilterChange, query, replaceFilterHistory]
  )

  return {
    activeGroup,
    handleActiveGroupChange,
    handleQueryChange,
    query,
    searchParams,
  }
}
