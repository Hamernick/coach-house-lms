import { NextResponse, type NextRequest } from "next/server"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

const EVENT_TYPES = new Set(["open", "select"])

type Payload = {
  eventType?: "open" | "select"
  query?: string
  context?: string
  resultId?: string
  resultGroup?: string
  resultHref?: string
}

export async function POST(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: error?.message ?? "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => ({}))) as Payload
  const eventType = payload.eventType
  if (!eventType || !EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 })
  }

  const query = typeof payload.query === "string" ? payload.query.trim().slice(0, 200) : null
  const resultId = typeof payload.resultId === "string" ? payload.resultId : null
  const resultGroup = typeof payload.resultGroup === "string" ? payload.resultGroup : null
  const resultHref = typeof payload.resultHref === "string" ? payload.resultHref : null
  const context = typeof payload.context === "string" ? payload.context : null

  const { error: insertError } = await supabase.from("search_events").insert({
    user_id: user.id,
    event_type: eventType,
    query,
    query_length: query ? query.length : null,
    context,
    result_id: resultId,
    result_group: resultGroup,
    result_href: resultHref,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
