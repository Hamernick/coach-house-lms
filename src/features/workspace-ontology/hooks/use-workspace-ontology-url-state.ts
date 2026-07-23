"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import {
  applyWorkspaceOntologyStateToParams,
  readWorkspaceOntologyUrlState,
} from "../lib"
import type { WorkspaceOntologyState } from "../types"

export function useWorkspaceOntologyUrlState() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const serializedSearchParams = searchParams.toString()
  const state = useMemo(
    () =>
      readWorkspaceOntologyUrlState(
        new URLSearchParams(serializedSearchParams)
      ),
    [serializedSearchParams]
  )
  const setState = useCallback(
    (next: WorkspaceOntologyState) => {
      const params = applyWorkspaceOntologyStateToParams(
        new URLSearchParams(window.location.search),
        next
      )
      const query = params.toString()
      const href = `${pathname}${query ? `?${query}` : ""}${window.location.hash}`
      const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (href === currentHref) return
      window.history.pushState(null, "", href)
    },
    [pathname]
  )

  return { state, setState }
}
