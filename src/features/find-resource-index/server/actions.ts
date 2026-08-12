import { unstable_cache } from "next/cache"

import {
  fetchPublicResourceMapItemById,
  fetchPublicResourceMapItems,
} from "@/lib/queries/resource-map-public-items"

import {
  resolveFindResourceDetailItem,
  serializeFindResourceIndexItem,
} from "../lib"

const fetchFindResourceIndexItemsCached = unstable_cache(
  async () => {
    const items = await fetchPublicResourceMapItems()
    return items.map(serializeFindResourceIndexItem)
  },
  ["find-resource-index-v2"],
  { revalidate: 300 }
)

const fetchFindResourceDetailItemCached = unstable_cache(
  async (id: string) => {
    const item = await fetchPublicResourceMapItemById(id)
    return item ? resolveFindResourceDetailItem([item], id) : null
  },
  ["find-resource-detail-v2"],
  { revalidate: 300 }
)

export async function fetchFindResourceIndexItems() {
  return fetchFindResourceIndexItemsCached()
}

export async function fetchFindResourceDetailItem(id: string) {
  return fetchFindResourceDetailItemCached(id)
}
