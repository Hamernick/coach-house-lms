import type { FinancePlanningViewId } from "./finance-plan-diagram-data"
import {
  resolveFinancePlanningNodeId,
  resolveFinancePlanningViewId,
} from "./finance-plan-views"

export const FINANCE_PLANNING_NODE_QUERY_PARAM = "planNode"
export const FINANCE_PLANNING_VIEW_QUERY_PARAM = "planView"

export type FinancePlanningLocation = {
  nodeId: string | null
  viewId: FinancePlanningViewId
}

export function readFinancePlanningViewFromParams(
  params: URLSearchParams
): FinancePlanningViewId {
  return resolveFinancePlanningViewId(
    params.get(FINANCE_PLANNING_VIEW_QUERY_PARAM)
  )
}

export function readFinancePlanningLocationFromParams(
  params: URLSearchParams
): FinancePlanningLocation {
  const viewId = readFinancePlanningViewFromParams(params)
  return {
    nodeId: resolveFinancePlanningNodeId(
      viewId,
      params.get(FINANCE_PLANNING_NODE_QUERY_PARAM)
    ),
    viewId,
  }
}

export function applyFinancePlanningViewToParams(
  params: URLSearchParams,
  viewId: FinancePlanningViewId
) {
  const nextParams = new URLSearchParams(params)

  if (viewId === "roadmap") {
    nextParams.delete(FINANCE_PLANNING_VIEW_QUERY_PARAM)
  } else {
    nextParams.set(FINANCE_PLANNING_VIEW_QUERY_PARAM, viewId)
  }
  nextParams.delete(FINANCE_PLANNING_NODE_QUERY_PARAM)

  return nextParams
}

export function applyFinancePlanningLocationToParams(
  params: URLSearchParams,
  location: FinancePlanningLocation
) {
  const nextParams = applyFinancePlanningViewToParams(params, location.viewId)
  const nodeId = resolveFinancePlanningNodeId(location.viewId, location.nodeId)

  if (nodeId) nextParams.set(FINANCE_PLANNING_NODE_QUERY_PARAM, nodeId)
  return nextParams
}

export function buildFinancePlanningViewHref({
  hash,
  pathname,
  searchParams,
  viewId,
}: {
  hash?: string
  pathname: string
  searchParams: URLSearchParams
  viewId: FinancePlanningViewId
}) {
  const nextParams = applyFinancePlanningViewToParams(searchParams, viewId)
  const query = nextParams.toString()
  return `${pathname}${query ? `?${query}` : ""}${hash ?? ""}`
}

export function buildFinancePlanningLocationHref({
  hash,
  location,
  pathname,
  searchParams,
}: {
  hash?: string
  location: FinancePlanningLocation
  pathname: string
  searchParams: URLSearchParams
}) {
  const nextParams = applyFinancePlanningLocationToParams(
    searchParams,
    location
  )
  const query = nextParams.toString()
  return `${pathname}${query ? `?${query}` : ""}${hash ?? ""}`
}
