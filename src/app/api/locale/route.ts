import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { getLocaleCookieName, isSupportedLocale } from "@/lib/locale"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const locale = body?.locale

  if (typeof locale !== "string" || !isSupportedLocale(locale)) {
    return NextResponse.json({ error: "Unsupported locale" }, { status: 400 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(getLocaleCookieName(), locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })

  return response
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
