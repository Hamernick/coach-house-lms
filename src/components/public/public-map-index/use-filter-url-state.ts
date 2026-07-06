"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { type PublicMapGroupFilterKey } from "./category-filter"
import {
  buildPublicMapFilterHref,
  resolvePublicMapFilterUrlState,
} from "./filter-url-state"

export function usePublicMapFilterUrlState({
  onFilterChange,
}: {
  onFilterChange: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialFilterState = resolvePublicMapFilterUrlState(
    new URLSearchParams(searchParams.toString())
  )
  const [query, setQuery] = useState(initialFilterState.query)
  const [activeGroup, setActiveGroup] = useState<PublicMapGroupFilterKey>(
    initialFilterState.activeGroup
  )
  const filterStateRef = useRef(initialFilterState)

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

  const replaceFilterUrl = useCallback(
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
      router.replace(nextHref, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const handleQueryChange = useCallback(
    (value: string) => {
      onFilterChange()
      setQuery(value)
      replaceFilterUrl({
        nextActiveGroup: activeGroup,
        nextQuery: value,
      })
    },
    [activeGroup, onFilterChange, replaceFilterUrl]
  )

  const handleActiveGroupChange = useCallback(
    (value: PublicMapGroupFilterKey) => {
      onFilterChange()
      setActiveGroup(value)
      replaceFilterUrl({
        nextActiveGroup: value,
        nextQuery: query,
      })
    },
    [onFilterChange, query, replaceFilterUrl]
  )

  return {
    activeGroup,
    handleActiveGroupChange,
    handleQueryChange,
    query,
    searchParams,
  }
}
