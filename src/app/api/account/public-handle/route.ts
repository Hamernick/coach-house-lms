import { NextResponse, type NextRequest } from "next/server"

import { claimPersonPublicHandleAction } from "@/actions/public-profile-actions"

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    handle?: unknown
  } | null
  const handle = typeof body?.handle === "string" ? body.handle : ""
  const result = await claimPersonPublicHandleAction(handle)

  return NextResponse.json(result, {
    status: result.ok ? 200 : result.code === "taken" ? 409 : 400,
  })
}
