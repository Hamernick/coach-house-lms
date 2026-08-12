import { NextResponse } from "next/server"

import { serializeFindResourceDetailItem } from "@/features/find-resource-index"
import { fetchPublicResourceMapItems } from "@/lib/queries/resource-map-public-items"

export const revalidate = 300

const PUBLIC_RESOURCE_MAP_ITEMS_CACHE_CONTROL =
  "public, s-maxage=300, stale-while-revalidate=600"

export async function GET() {
  const resourceItems = await fetchPublicResourceMapItems()

  return NextResponse.json(
    {
      resourceItems: resourceItems.map(serializeFindResourceDetailItem),
    },
    {
      headers: {
        "Cache-Control": PUBLIC_RESOURCE_MAP_ITEMS_CACHE_CONTROL,
      },
    }
  )
}
