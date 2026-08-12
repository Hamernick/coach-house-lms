import { fetchPublicResourceMapItems } from "@/lib/queries/resource-map-public-items"

import { serializeFindResourceIndexItem } from "../lib"

export async function fetchFindResourceIndexItems() {
  const items = await fetchPublicResourceMapItems()
  return items.map(serializeFindResourceIndexItem)
}
