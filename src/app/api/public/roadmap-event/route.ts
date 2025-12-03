import { NextResponse } from "next/server"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"

type EventBody = {
  orgSlug?: string
  sectionId?: string | null
  eventType?: "view" | "cta_click"
  durationMs?: number | null
  source?: string | null
  referrer?: string | null
}

export async function POST(request: Request) {
  let payload: EventBody
  try {
    payload = (await request.json()) as EventBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!payload?.orgSlug || !payload.eventType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const { data: orgRow, error } = await admin
    .from("organizations")
    .select("user_id")
    .ilike("public_slug", payload.orgSlug)
    .maybeSingle<{ user_id: string }>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!orgRow) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 })
  }

  await admin.from("roadmap_events").insert({
    org_id: orgRow.user_id,
    section_id: payload.sectionId ?? null,
    event_type: payload.eventType,
    duration_ms: payload.durationMs ?? null,
    source: payload.source ?? null,
    referrer: payload.referrer ?? null,
  })

  return NextResponse.json({ ok: true })
}
