import { NextResponse } from "next/server"

import {
  FIND_RESOURCE_INDEX_CACHE_CONTROL,
  type FindResourceDetailResponse,
} from "@/features/find-resource-index"
import { fetchFindResourceDetailItem } from "../../../../../../features/find-resource-index/server/actions"

export const revalidate = 300

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params
  const id = rawId.trim()
  if (!id || id.length > 256) {
    return NextResponse.json({ error: "invalid resource ID" }, { status: 400 })
  }

  const resourceItem = await fetchFindResourceDetailItem(id)
  if (!resourceItem) {
    return NextResponse.json({ error: "resource not found" }, { status: 404 })
  }

  const payload: FindResourceDetailResponse = {
    version: 1,
    resourceItem,
  }
  return NextResponse.json(payload, {
    headers: { "Cache-Control": FIND_RESOURCE_INDEX_CACHE_CONTROL },
  })
}
