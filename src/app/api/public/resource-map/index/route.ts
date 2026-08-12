import { NextResponse } from "next/server"

import {
  FIND_RESOURCE_INDEX_CACHE_CONTROL,
  paginateFindResourceIndexItems,
  parseFindResourceIndexLimit,
} from "@/features/find-resource-index"
import { fetchFindResourceIndexItems } from "../../../../../features/find-resource-index/server/actions"

export const revalidate = 300

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const limit = parseFindResourceIndexLimit(searchParams.get("limit"))
  if (limit === null) {
    return NextResponse.json(
      { error: "limit must be an integer between 1 and 500" },
      { status: 400 }
    )
  }

  const cursor = searchParams.get("cursor")?.trim() || null
  const resourceItems = await fetchFindResourceIndexItems()
  const payload = paginateFindResourceIndexItems({
    cursor,
    items: resourceItems,
    limit,
  })

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": FIND_RESOURCE_INDEX_CACHE_CONTROL,
    },
  })
}
