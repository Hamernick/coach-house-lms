import { unstable_cache } from "next/cache"

import { fetchPublicResourceMapItems } from "@/lib/queries/resource-map-public-items"

import { serializeFindResourceIndexItem } from "../lib"

const fetchFindResourceIndexItemsCached = unstable_cache(
  async () => {
    const items = await fetchPublicResourceMapItems()
    return items.map(serializeFindResourceIndexItem)
  },
  ["find-resource-index-v2"],
  { revalidate: 300 }
)

export async function fetchFindResourceIndexItems() {
  return fetchFindResourceIndexItemsCached()
}
