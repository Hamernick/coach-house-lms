import { NextResponse, type NextRequest } from "next/server"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

type MapPreferences = {
  favorites: string[]
  savedQueries: string[]
  recentOrganizationIds: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function normalizeStringArray(value: unknown, limit = 80) {
  if (!Array.isArray(value)) return []
  const unique = new Set<string>()
  for (const entry of value) {
    if (typeof entry !== "string") continue
    const normalized = entry.trim()
    if (!normalized) continue
    unique.add(normalized)
    if (unique.size >= limit) break
  }
  return Array.from(unique)
}

function parseMapPreferences(metadata: unknown): MapPreferences {
  const mapPreferences = isRecord(metadata) && isRecord(metadata.map_preferences) ? metadata.map_preferences : {}
  return {
    favorites: normalizeStringArray(mapPreferences.favorites, 120),
    savedQueries: normalizeStringArray(mapPreferences.savedQueries, 40),
    recentOrganizationIds: normalizeStringArray(
      mapPreferences.recentOrganizationIds,
      40,
    ),
  }
}

export async function GET(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json(
    {
      preferences: parseMapPreferences(user.user_metadata ?? {}),
      user: {
        id: user.id,
        email: user.email ?? null,
      },
    },
    { status: 200 },
  )
}

export async function PATCH(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await request.json().catch(() => ({}))
  const payloadRecord = isRecord(payload) ? payload : {}
  const current = parseMapPreferences(user.user_metadata ?? {})

  const next: MapPreferences = {
    favorites:
      "favorites" in payloadRecord
        ? normalizeStringArray(payloadRecord.favorites, 120)
        : current.favorites,
    savedQueries:
      "savedQueries" in payloadRecord
        ? normalizeStringArray(payloadRecord.savedQueries, 40)
        : current.savedQueries,
    recentOrganizationIds:
      "recentOrganizationIds" in payloadRecord
        ? normalizeStringArray(payloadRecord.recentOrganizationIds, 40)
        : current.recentOrganizationIds,
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      map_preferences: next,
    },
  })

  if (updateError) {
    return NextResponse.json({ error: updateError.message || "Unable to save preferences" }, { status: 500 })
  }

  return NextResponse.json({ preferences: next }, { status: 200 })
}
