import { NextResponse } from "next/server"

import {
  recordPageHealthEvent,
  type PageHealthEventInput,
} from "@/features/page-health-monitor"
import { resolveOptionalAuthenticatedAppContext } from "@/lib/auth/request-context"

const MAX_PAGE_HEALTH_PAYLOAD_BYTES = 16_384

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function isAllowedPageHealthOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return true

  try {
    const originHost = new URL(origin).host
    const requestHost =
      request.headers.get("host") ??
      request.headers.get("x-forwarded-host") ??
      new URL(request.url).host
    return originHost === requestHost
  } catch {
    return false
  }
}

function isOversizedPageHealthRequest(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0)
  return (
    Number.isFinite(contentLength) &&
    contentLength > MAX_PAGE_HEALTH_PAYLOAD_BYTES
  )
}

async function readPageHealthInput(request: Request) {
  if (isOversizedPageHealthRequest(request)) return "payload_too_large"

  try {
    const body = await request.text()
    if (new TextEncoder().encode(body).length > MAX_PAGE_HEALTH_PAYLOAD_BYTES) {
      return "payload_too_large"
    }
    const payload = JSON.parse(body)
    return isPlainObject(payload) ? (payload as PageHealthEventInput) : null
  } catch {
    return null
  }
}

async function resolvePageHealthActor() {
  try {
    const context = await resolveOptionalAuthenticatedAppContext()
    return {
      orgId: context?.activeOrg.orgId ?? null,
      userId: context?.user.id ?? null,
    }
  } catch {
    return {
      orgId: null,
      userId: null,
    }
  }
}

export async function POST(request: Request) {
  if (!isAllowedPageHealthOrigin(request)) {
    return NextResponse.json(
      { ok: false, reason: "origin_not_allowed" },
      { status: 403 }
    )
  }

  const input = await readPageHealthInput(request)
  if (input === "payload_too_large") {
    return NextResponse.json(
      { ok: false, reason: "payload_too_large" },
      { status: 413 }
    )
  }

  if (!input) {
    return NextResponse.json(
      { ok: false, reason: "invalid_payload" },
      { status: 400 }
    )
  }

  const actor = await resolvePageHealthActor()
  const result = await recordPageHealthEvent({
    input,
    orgId: actor.orgId,
    userId: actor.userId,
  })

  if (!result.ok) {
    return NextResponse.json(result, { status: 202 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
