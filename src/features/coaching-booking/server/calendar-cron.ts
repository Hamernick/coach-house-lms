import "server-only"
import { timingSafeEqual } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"
import { env } from "@/lib/env"
import { reconcileCoachingCalendar } from "./calendar-reconciliation"

export async function coachingCalendarCron(request: NextRequest) {
  const secret = env.GOOGLE_CALENDAR_CRON_SECRET
  const expected = Buffer.from(`Bearer ${secret ?? ""}`)
  const actual = Buffer.from(request.headers.get("authorization") ?? "")
  if (
    !secret ||
    secret.length < 32 ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    return NextResponse.json(await reconcileCoachingCalendar(), {
      headers: { "cache-control": "no-store" },
    })
  } catch {
    return NextResponse.json(
      { error: "Coaching calendar reconciliation failed" },
      { status: 503 }
    )
  }
}
