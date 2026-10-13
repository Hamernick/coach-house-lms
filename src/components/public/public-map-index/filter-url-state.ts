import {
  resolvePublicMapGroupFilterParam,
  type PublicMapGroupFilterKey,
} from "./category-filter"

export const PUBLIC_MAP_QUERY_PARAM = "q"
export const PUBLIC_MAP_CATEGORY_PARAM = "category"

export type PublicMapFilterUrlState = {
  activeGroup: PublicMapGroupFilterKey
  query: string
}

export function normalizePublicMapQueryParam(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : ""
}

export function resolvePublicMapFilterUrlState(
  searchParams: URLSearchParams
): PublicMapFilterUrlState {
  return {
    activeGroup: resolvePublicMapGroupFilterParam(
      searchParams.get(PUBLIC_MAP_CATEGORY_PARAM)
    ),
    query: normalizePublicMapQueryParam(
      searchParams.get(PUBLIC_MAP_QUERY_PARAM)
    ),
  }
}

export function buildPublicMapFilterSearchParams({
  activeGroup,
  query,
  searchParams,
}: {
  activeGroup: PublicMapGroupFilterKey
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

  return nextParams
}

export function buildPublicMapFilterHref({
  activeGroup,
  pathname,
  query,
  searchParams,
}: {
  activeGroup: PublicMapGroupFilterKey
  pathname: string
  query: string
  searchParams: URLSearchParams
}) {
  const nextParams = buildPublicMapFilterSearchParams({
    activeGroup,
    query,
    searchParams,
  })
  const serialized = nextParams.toString()

  return serialized ? `${pathname}?${serialized}` : pathname
}
