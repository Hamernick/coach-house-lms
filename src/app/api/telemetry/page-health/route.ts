import { NextResponse } from "next/server"

import {
  recordPageHealthEvent,
  type PageHealthEventInput,
} from "@/features/page-health-monitor"
import { resolveOptionalAuthenticatedAppContext } from "@/lib/auth/request-context"

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

async function readPageHealthInput(request: Request) {
  try {
    const payload = await request.json()
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
  const input = await readPageHealthInput(request)
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
