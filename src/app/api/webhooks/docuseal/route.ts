import { NextResponse, type NextRequest } from "next/server"

import { handleFiscalSponsorshipDocuSealWebhook } from "@/features/fiscal-sponsorship"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const result = await handleFiscalSponsorshipDocuSealWebhook({
    headers: Object.fromEntries(request.headers.entries()),
    rawBody,
  })

  if ("error" in result) {
    return new NextResponse(result.error, { status: result.status })
  }

  return NextResponse.json(
    { ignored: Boolean(result.ignored), ok: true },
    { status: result.status ?? 200 }
  )
}
