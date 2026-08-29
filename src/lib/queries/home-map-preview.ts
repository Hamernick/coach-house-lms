import { unstable_cache } from "next/cache"

import { buildHomeMapPreviewFeatures } from "@/lib/public-map/home-map-preview"
import { fetchPublicMapOrganizations } from "@/lib/queries/public-map-index"
import {
  fetchPublicResourceMapItemsPageById,
  type FetchPublicResourceMapItemsPageResult,
} from "@/lib/queries/resource-map-public-items"

const HOME_MAP_PREVIEW_RESOURCE_LIMIT = 5_000
const HOME_MAP_PREVIEW_RESOURCE_PAGE_SIZE = 500

type FetchHomeMapPreviewResourcePage = (options: {
  cursor: string | null
  limit: number
}) => Promise<FetchPublicResourceMapItemsPageResult>

export async function fetchHomeMapPreviewResourceItems(
  fetchPage: FetchHomeMapPreviewResourcePage = ({ cursor, limit }) =>
    fetchPublicResourceMapItemsPageById({
      cursor,
      limit,
      options: {
        ignoreLocalPreviewFile: true,
        includeDiscoveryCandidates: false,
      },
    })
) {
  const items: FetchPublicResourceMapItemsPageResult["items"] = []
  let cursor: string | null = null

  while (items.length < HOME_MAP_PREVIEW_RESOURCE_LIMIT) {
    const limit = Math.min(
      HOME_MAP_PREVIEW_RESOURCE_PAGE_SIZE,
      HOME_MAP_PREVIEW_RESOURCE_LIMIT - items.length
    )
    const page = await fetchPage({ cursor, limit })
    const pageItems = page.items.slice(0, limit)
    items.push(...pageItems)

    const nextCursor = pageItems.at(-1)?.id ?? null
    if (page.items.length <= limit || !nextCursor || nextCursor === cursor) {
      break
    }
    cursor = nextCursor
  }

  return items
}

const fetchHomeMapPreviewFeaturesCached = unstable_cache(
  async () => {
    const [organizations, resourceItems] = await Promise.all([
      fetchPublicMapOrganizations(),
      fetchHomeMapPreviewResourceItems(),
    ])
    return buildHomeMapPreviewFeatures({ organizations, resourceItems })
  },
  ["public-home-map-preview-v13"],
  { revalidate: 300, tags: ["public-home-map-preview"] }
)

export async function fetchHomeMapPreviewFeatures() {
  return fetchHomeMapPreviewFeaturesCached()
}
