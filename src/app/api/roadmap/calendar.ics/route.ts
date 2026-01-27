import { NextResponse } from "next/server"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"

const CALENDAR_TABLES = {
  public: {
    events: "roadmap_calendar_public_events",
    feeds: "roadmap_calendar_public_feeds",
    label: "Roadmap Calendar (Public)",
  },
  internal: {
    events: "roadmap_calendar_internal_events",
    feeds: "roadmap_calendar_internal_feeds",
    label: "Roadmap Calendar (Internal)",
  },
} as const

type CalendarType = keyof typeof CALENDAR_TABLES

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

function formatIcsDateTime(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

function formatIcsDateOnly(value: Date) {
  return value.toISOString().slice(0, 10).replace(/-/g, "")
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")?.trim()
  const typeParam = searchParams.get("type")?.trim() ?? "public"

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 })
  }

  if (typeParam !== "public" && typeParam !== "internal") {
    return NextResponse.json({ error: "Invalid calendar type." }, { status: 400 })
  }

  const type = typeParam as CalendarType
  const admin = createSupabaseAdminClient()

  const { data: feedRow } = await admin
    .from(CALENDAR_TABLES[type].feeds)
    .select("org_id")
    .eq("token", token)
    .maybeSingle<{ org_id: string }>()

  if (!feedRow) {
    return NextResponse.json({ error: "Feed not found." }, { status: 404 })
  }

  const { data: events } = await admin
    .from(CALENDAR_TABLES[type].events)
    .select("id,title,description,starts_at,ends_at,all_day,status,updated_at")
    .eq("org_id", feedRow.org_id)
    .eq("status", "active")
    .order("starts_at", { ascending: true })
    .returns<
      Array<{
        id: string
        title: string
        description: string | null
        starts_at: string
        ends_at: string | null
        all_day: boolean
        status: string
        updated_at: string
      }>
    >()

  const now = formatIcsDateTime(new Date())
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Coach House//Roadmap Calendar//EN",
    `X-WR-CALNAME:${escapeIcsText(CALENDAR_TABLES[type].label)}`,
    "CALSCALE:GREGORIAN",
  ]

  for (const event of events ?? []) {
    const start = new Date(event.starts_at)
    const end = event.ends_at ? new Date(event.ends_at) : null
    const eventStart = event.all_day ? formatIcsDateOnly(start) : formatIcsDateTime(start)
    const eventEnd = event.all_day
      ? formatIcsDateOnly(new Date(start.getTime() + 24 * 60 * 60 * 1000))
      : formatIcsDateTime(end ?? new Date(start.getTime() + 60 * 60 * 1000))

    lines.push("BEGIN:VEVENT")
    lines.push(`UID:${event.id}@coachhouse`)
    lines.push(`DTSTAMP:${now}`)
    if (event.all_day) {
      lines.push(`DTSTART;VALUE=DATE:${eventStart}`)
      lines.push(`DTEND;VALUE=DATE:${eventEnd}`)
    } else {
      lines.push(`DTSTART:${eventStart}`)
      lines.push(`DTEND:${eventEnd}`)
    }
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`)
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`)
    }
    if (event.updated_at) {
      lines.push(`LAST-MODIFIED:${formatIcsDateTime(new Date(event.updated_at))}`)
    }
    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")

  return new NextResponse(lines.join("\r\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  })
}
