import { NextResponse } from "next/server"

import type { Json } from "@/lib/supabase"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"

type PositionPayload = {
  id?: unknown
  x?: unknown
  y?: unknown
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number") return null
  if (!Number.isFinite(value)) return null
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as PositionPayload | null
  const personId = typeof payload?.id === "string" ? payload.id.trim() : ""
  const x = toFiniteNumber(payload?.x)
  const y = toFiniteNumber(payload?.y)

  if (!personId || x == null || y == null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  if (!canEditOrganization(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  if (orgError) {
    return NextResponse.json({ error: "Unable to load organization." }, { status: 500 })
  }

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const people = Array.isArray(profile.org_people)
    ? profile.org_people.filter((entry): entry is Record<string, unknown> => isRecord(entry))
    : []

  const personIndex = people.findIndex((entry) => entry.id === personId)
  if (personIndex < 0) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 })
  }

  people[personIndex] = {
    ...people[personIndex],
    pos: { x, y },
  }

  const nextProfile = {
    ...profile,
    org_people: people,
  } as Json

  const { error: upsertError } = await supabase
    .from("organizations")
    .upsert(
      {
        user_id: orgId,
        profile: nextProfile,
      },
      { onConflict: "user_id" },
    )

  if (upsertError) {
    return NextResponse.json({ error: "Unable to save position." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
