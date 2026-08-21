import {
  resolvePublicMapGroupFilterParam,
  type PublicMapGroupFilterKey,
} from "./category-filter"
import {
  isPublicMapResourceGuideId,
  type PublicMapResourceGuideId,
} from "@/lib/public-map/resource-guide-ids"

export const PUBLIC_MAP_QUERY_PARAM = "q"
export const PUBLIC_MAP_CATEGORY_PARAM = "category"
export const PUBLIC_MAP_GUIDE_PARAM = "guide"

export type PublicMapFilterUrlState = {
  activeGroup: PublicMapGroupFilterKey
  activeGuideId: PublicMapResourceGuideId | null
  query: string
}

export function normalizePublicMapQueryParam(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : ""
}

export function resolvePublicMapFilterUrlState(
  searchParams: URLSearchParams
): PublicMapFilterUrlState {
  const guideParam = searchParams.get(PUBLIC_MAP_GUIDE_PARAM)
  return {
    activeGroup: resolvePublicMapGroupFilterParam(
      searchParams.get(PUBLIC_MAP_CATEGORY_PARAM)
    ),
    activeGuideId: isPublicMapResourceGuideId(guideParam) ? guideParam : null,
    query: normalizePublicMapQueryParam(
      searchParams.get(PUBLIC_MAP_QUERY_PARAM)
    ),
  }
}

export function buildPublicMapFilterSearchParams({
  activeGroup,
  activeGuideId,
  query,
  searchParams,
}: {
  activeGroup: PublicMapGroupFilterKey
  activeGuideId: PublicMapResourceGuideId | null
  query: string
  searchParams: URLSearchParams
}) {
  const nextParams = new URLSearchParams(searchParams)
  const normalizedQuery = normalizePublicMapQueryParam(query)

  if (normalizedQuery) {
    nextParams.set(PUBLIC_MAP_QUERY_PARAM, normalizedQuery)
  } else {
    nextParams.delete(PUBLIC_MAP_QUERY_PARAM)
  }

  if (activeGroup === "all") {
    nextParams.delete(PUBLIC_MAP_CATEGORY_PARAM)
  } else {
    nextParams.set(PUBLIC_MAP_CATEGORY_PARAM, activeGroup)
  }

  if (activeGuideId) {
    nextParams.set(PUBLIC_MAP_GUIDE_PARAM, activeGuideId)
  } else {
    nextParams.delete(PUBLIC_MAP_GUIDE_PARAM)
  }

  return nextParams
}

export function buildPublicMapFilterHref({
  activeGroup,
  activeGuideId,
  pathname,
  query,
  searchParams,
}: {
  activeGroup: PublicMapGroupFilterKey
  activeGuideId: PublicMapResourceGuideId | null
  pathname: string
  query: string
  searchParams: URLSearchParams
}) {
  const nextParams = buildPublicMapFilterSearchParams({
    activeGroup,
    activeGuideId,
    query,
    searchParams,
  })
  const serialized = nextParams.toString()

  return serialized ? `${pathname}?${serialized}` : pathname
}
