import { NextResponse } from "next/server"

import {
  FIND_RESOURCE_INDEX_CACHE_CONTROL,
  FIND_RESOURCE_INDEX_VERSION,
  type FindResourceIndexResponse,
} from "@/features/find-resource-index"
import { fetchFindResourceIndexItems } from "../../../../../features/find-resource-index/server/actions"

export const revalidate = 300

export async function GET() {
  const resourceItems = await fetchFindResourceIndexItems()
  const payload: FindResourceIndexResponse = {
    version: FIND_RESOURCE_INDEX_VERSION,
    resourceItems,
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": FIND_RESOURCE_INDEX_CACHE_CONTROL,
    },
  })
}
