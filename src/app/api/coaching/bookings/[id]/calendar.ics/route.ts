import { NextRequest, NextResponse } from "next/server"

import { env } from "@/lib/env"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase"
import {
  COACHING_JOINT_COACH_LABEL,
  COACHING_PATH,
  COACHING_SESSION_MINUTES,
  escapeIcsText,
  formatIcsDate,
  getValidGoogleCalendarEventUrl,
  getValidGoogleMeetUrl,
} from "../../../../../../features/coaching-booking/lib"

const CANONICAL_SITE_URL = "https://coachhouse.app"
const ICS_LINE_LIMIT = 75

function isLocalUrl(value: string) {
  try {
    const url = new URL(value)
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1"
  } catch {
    return false
  }
}

function resolveSiteUrl(request: NextRequest) {
  const candidates = [env.NEXT_PUBLIC_SITE_URL, env.NEXT_PUBLIC_APP_URL, request.nextUrl.origin]

  for (const candidate of candidates) {
    const normalized = candidate?.trim().replace(/\/+$/, "")
    if (normalized && !isLocalUrl(normalized)) return normalized
  }

  return CANONICAL_SITE_URL
}

function foldIcsLine(line: string) {
  if (line.length <= ICS_LINE_LIMIT) return line

  const chunks = [line.slice(0, ICS_LINE_LIMIT)]
  let remaining = line.slice(ICS_LINE_LIMIT)
  while (remaining.length > 0) {
    chunks.push(` ${remaining.slice(0, ICS_LINE_LIMIT - 1)}`)
    remaining = remaining.slice(ICS_LINE_LIMIT - 1)
  }
  return chunks.join("\r\n")
}

function buildIcsDescription({
  googleMeetUrl,
  googleEventHtmlLink,
  attendeeNotes,
  coachingUrl,
}: {
  googleMeetUrl: string | null
  googleEventHtmlLink: string | null
  attendeeNotes: string | null
  coachingUrl: string
}) {
  return [
    `Coach House advisory session with ${COACHING_JOINT_COACH_LABEL}.`,
    "",
    `Duration: ${COACHING_SESSION_MINUTES} minutes`,
    ...(googleMeetUrl ? [`Google Meet: ${googleMeetUrl}`] : []),
    ...(googleEventHtmlLink ? [`Google Calendar invite: ${googleEventHtmlLink}`] : []),
    `Manage session: ${coachingUrl}`,
    "",
    "Use the Google Calendar invite for updates or rescheduling.",
    ...(attendeeNotes?.trim() ? ["", `Session notes: ${attendeeNotes.trim()}`] : []),
  ].join("\n")
}

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
    .select("id, starts_at, ends_at, timezone, attendee_notes, google_meet_url, google_event_html_link")
    .eq("id", id)
    .maybeSingle<{
      id: string
      starts_at: string
      ends_at: string
      timezone: string
      attendee_notes: string | null
      google_meet_url: string | null
      google_event_html_link: string | null
    }>()

  if (error) {
    return NextResponse.json({ error: "Unable to load booking." }, { status: 500 })
  }
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const googleMeetUrl = getValidGoogleMeetUrl(booking.google_meet_url)
  const googleEventHtmlLink = getValidGoogleCalendarEventUrl(booking.google_event_html_link)
  const siteUrl = resolveSiteUrl(request)
  const coachingUrl = `${siteUrl}${COACHING_PATH}`
  const eventUrl = googleMeetUrl ?? googleEventHtmlLink ?? coachingUrl
  const description = buildIcsDescription({
    googleMeetUrl,
    googleEventHtmlLink,
    attendeeNotes: booking.attendee_notes,
    coachingUrl,
  })
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Coach House//Coaching//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "NAME:Coach House Coaching",
    "X-WR-CALNAME:Coach House Coaching",
    "BEGIN:VEVENT",
    `UID:${booking.id}@coachhouse.app`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${formatIcsDate(booking.starts_at)}`,
    `DTEND:${formatIcsDate(booking.ends_at)}`,
    `SUMMARY:${escapeIcsText(`Coach House Advisory Session with ${COACHING_JOINT_COACH_LABEL}`)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "CATEGORIES:Coach House,Coaching",
    ...(booking.timezone ? [`X-COACH-HOUSE-TIMEZONE:${escapeIcsText(booking.timezone)}`] : []),
    ...(googleMeetUrl
      ? [
          "LOCATION:Google Meet",
          `CONFERENCE;VALUE=URI;FEATURE=AUDIO,VIDEO;LABEL="Google Meet":${escapeIcsText(googleMeetUrl)}`,
        ]
      : ["LOCATION:Online"]),
    `URL:${escapeIcsText(eventUrl)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]

  return new NextResponse(`${lines.map(foldIcsLine).join("\r\n")}\r\n`, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="coach-house-${booking.id}.ics"`,
    },
  })
}
