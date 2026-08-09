import { NextResponse } from "next/server"

import {
  canEditOrganization,
  resolveActiveOrganization,
} from "@/lib/organization/active-org"
import { mutateOrganizationPeopleProfile } from "@/lib/people/profile-write"
import { createSupabaseServerClient } from "@/lib/supabase/server"

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

  const rawPayload = (await request.json().catch(() => null)) as
    | (PositionPayload & BulkPayload)
    | null
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
    .filter(
      (entry): entry is { id: string; x: number; y: number } => entry !== null
    )

  if (parsedPositions.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  if (!canEditOrganization(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const writeResult = await mutateOrganizationPeopleProfile<
    Record<string, unknown>,
    { updated: number }
  >({
    supabase,
    orgId,
    mutate: (people) => {
      const nextPeople = people.map((person) =>
        isRecord(person) ? { ...person } : person
      )
      const peopleById = new Map<string, number>()
      nextPeople.forEach((person, index) => {
        if (typeof person.id === "string") peopleById.set(person.id, index)
      })

      let updated = 0
      for (const position of parsedPositions) {
        const personIndex = peopleById.get(position.id)
        if (personIndex == null) continue
        nextPeople[personIndex] = {
          ...nextPeople[personIndex],
          pos: { x: position.x, y: position.y },
        }
        updated += 1
      }

      if (updated === 0) return { error: "Person not found." }
      return {
        ok: true,
        changed: true,
        people: nextPeople,
        value: { updated },
      }
    },
  })

  if ("error" in writeResult) {
    const status = writeResult.error === "Person not found." ? 404 : 500
    return NextResponse.json({ error: writeResult.error }, { status })
  }

  return NextResponse.json({ ok: true, updated: writeResult.value.updated })
}
