"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import type { FinancePlanningViewId } from "./finance-plan-diagram-data"
import {
  buildFinancePlanningLocationHref,
  buildFinancePlanningViewHref,
  readFinancePlanningLocationFromParams,
  type FinancePlanningLocation,
} from "./finance-plan-url-state"
import { resolveFinancePlanningNodeId } from "./finance-plan-views"

export function useFinancePlanningViewUrlState() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const serializedSearchParams = searchParams.toString()
  const [activeLocation, setActiveLocation] = useState(() =>
    readFinancePlanningLocationFromParams(
      new URLSearchParams(serializedSearchParams)
    )
  )

  useEffect(() => {
    const syncViewFromUrl = () => {
      setActiveLocation(
        readFinancePlanningLocationFromParams(
          new URLSearchParams(window.location.search)
        )
      )
    }

    window.addEventListener("popstate", syncViewFromUrl)
    return () => window.removeEventListener("popstate", syncViewFromUrl)
  }, [])

  const pushLocation = useCallback(
    (nextHref: string, nextLocation: FinancePlanningLocation) => {
      const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (nextHref !== currentHref) {
        window.history.pushState(window.history.state, "", nextHref)
      }
      setActiveLocation(nextLocation)
    },
    []
  )

  const setActiveViewId = useCallback(
    (viewId: FinancePlanningViewId) => {
      const nextHref = buildFinancePlanningViewHref({
        hash: window.location.hash,
        pathname,
        searchParams: new URLSearchParams(window.location.search),
        viewId,
      })
      pushLocation(nextHref, { nodeId: null, viewId })
    },
    [pathname, pushLocation]
  )

  const setActiveNodeLocation = useCallback(
    (viewId: FinancePlanningViewId, nodeId: string) => {
      const nextLocation = {
        nodeId: resolveFinancePlanningNodeId(viewId, nodeId),
        viewId,
      }
      const nextHref = buildFinancePlanningLocationHref({
        hash: window.location.hash,
        location: nextLocation,
        pathname,
        searchParams: new URLSearchParams(window.location.search),
      })
      pushLocation(nextHref, nextLocation)
    },
    [pathname, pushLocation]
  )

  return {
    activeNodeId: activeLocation.nodeId,
    activeViewId: activeLocation.viewId,
    setActiveNodeLocation,
    setActiveViewId,
  }
}
