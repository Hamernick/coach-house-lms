import { NextResponse } from "next/server"

import type { Json } from "@/lib/supabase"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"

type PositionPayload = {
  id?: unknown
  x?: unknown
  y?: unknown
}

type BulkPayload = {
  positions?: unknown
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

  const rawPayload = (await request.json().catch(() => null)) as (PositionPayload & BulkPayload) | null
  const incomingPositions = Array.isArray(rawPayload?.positions)
    ? rawPayload?.positions
    : [rawPayload]

  const parsedPositions = incomingPositions
    .map((entry) => entry as PositionPayload)
    .map((entry) => {
      const id = typeof entry?.id === "string" ? entry.id.trim() : ""
      const x = toFiniteNumber(entry?.x)
      const y = toFiniteNumber(entry?.y)
      if (!id || x == null || y == null) return null
      return { id, x, y }
    })
    .filter((entry): entry is { id: string; x: number; y: number } => entry !== null)

  if (parsedPositions.length === 0) {
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

  const peopleById = new Map<string, number>()
  people.forEach((entry, index) => {
    if (typeof entry.id === "string") peopleById.set(entry.id, index)
  })

  let updatesApplied = 0
  for (const pos of parsedPositions) {
    const personIndex = peopleById.get(pos.id)
    if (personIndex == null) continue
    people[personIndex] = {
      ...people[personIndex],
      pos: { x: pos.x, y: pos.y },
    }
    updatesApplied += 1
  }

  if (updatesApplied === 0) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 })
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

  return NextResponse.json({ ok: true, updated: updatesApplied })
}
