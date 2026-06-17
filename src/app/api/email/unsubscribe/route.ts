import { NextResponse, type NextRequest } from "next/server"

import { applyEmailUnsubscribeToken } from "@/lib/email/consent"

export const runtime = "nodejs"

function resolveClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null
  return request.headers.get("x-real-ip")
}

async function resolveRequestPayload(request: NextRequest) {
  const queryToken = request.nextUrl.searchParams.get("token")
  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as
      | { token?: unknown; scope?: unknown }
      | null
    return {
      token: typeof body?.token === "string" ? body.token : queryToken,
      scope: body?.scope === "global" ? "global" : "topic",
      source: "preference_page",
    } as const
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData().catch(() => null)
    const formToken = formData?.get("token")
    const formScope = formData?.get("scope")
    const isOneClick =
      queryToken &&
      formData?.get("List-Unsubscribe") === "One-Click" &&
      !formToken &&
      !formScope
    return {
      token: typeof formToken === "string" ? formToken : queryToken,
      scope: formScope === "global" ? "global" : "topic",
      source: isOneClick ? "one_click_header" : "preference_page",
    } as const
  }

  return {
    token: queryToken,
    scope: "topic",
    source: "one_click_header",
  } as const
}

export async function POST(request: NextRequest) {
  const { token, scope, source } = await resolveRequestPayload(request)
  if (!token) {
    return new NextResponse("Missing unsubscribe token.", { status: 400 })
  }

  const result = await applyEmailUnsubscribeToken({
    token,
    scope,
    source,
    userAgent: request.headers.get("user-agent"),
    ipAddress: resolveClientIp(request),
  })

  if (!result.ok) {
    return new NextResponse(result.error, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    scope: result.scope,
    topicId: result.topicId,
  })
}
