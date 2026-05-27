import { NextRequest, NextResponse } from "next/server"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase"
import {
  COACHING_JOINT_COACH_LABEL,
  COACHING_PATH,
  escapeIcsText,
  formatIcsDate,
} from "../../../../../../features/coaching-booking/lib"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)
  const { id } = await params
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: booking, error } = await supabase
    .from("coaching_bookings")
    .select("id, starts_at, ends_at, google_meet_url")
    .eq("id", id)
    .maybeSingle<{
      id: string
      starts_at: string
      ends_at: string
      google_meet_url: string | null
    }>()

  if (error) {
    return NextResponse.json({ error: "Unable to load booking." }, { status: 500 })
  }
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const description = booking.google_meet_url
    ? `Coach House coaching session with ${COACHING_JOINT_COACH_LABEL}\\n${booking.google_meet_url}`
    : `Coach House coaching session with ${COACHING_JOINT_COACH_LABEL}`
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Coach House//Coaching//EN",
    "BEGIN:VEVENT",
    `UID:${booking.id}@coachhouse.app`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${formatIcsDate(booking.starts_at)}`,
    `DTEND:${formatIcsDate(booking.ends_at)}`,
    `SUMMARY:${escapeIcsText(`Coach House session with ${COACHING_JOINT_COACH_LABEL}`)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    ...(booking.google_meet_url ? [`LOCATION:${escapeIcsText(booking.google_meet_url)}`] : []),
    `URL:${escapeIcsText(`${request.nextUrl.origin}${COACHING_PATH}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="coach-house-${booking.id}.ics"`,
    },
  })
}
