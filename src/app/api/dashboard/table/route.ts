import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import rawData from "@/app/(dashboard)/dashboard/data.json"
import { dashboardTableRowSchema } from "@/lib/dashboard/table-data"

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 50
const MIN_PAGE = 1

const tableRows = dashboardTableRowSchema.array().parse(rawData)

export const revalidate = 60

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const pageParam = searchParams.get("page")
  const pageSizeParam = searchParams.get("pageSize")

  const parsedPage = pageParam ? Number.parseInt(pageParam, 10) : NaN
  const parsedPageSize = pageSizeParam ? Number.parseInt(pageSizeParam, 10) : NaN

  const page = Number.isFinite(parsedPage) && parsedPage >= MIN_PAGE ? parsedPage : MIN_PAGE
  const pageSize = clampPageSize(parsedPageSize)

  const offset = (page - 1) * pageSize
  const items = tableRows.slice(offset, offset + pageSize)

  return NextResponse.json({
    items,
    page,
    pageSize,
    total: tableRows.length,
  })
}

function clampPageSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_PAGE_SIZE
  }

  return Math.min(Math.max(1, Math.floor(value)), MAX_PAGE_SIZE)
}
