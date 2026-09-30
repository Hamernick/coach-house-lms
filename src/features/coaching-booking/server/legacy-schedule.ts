import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  resolveActiveOrganization,
  canEditOrganization,
} from "@/lib/organization/active-org"
import { normalizeCoachingCoachId } from "@/lib/meetings"
import { createNotification } from "@/lib/notifications"
import { resolveCoachingCreditSummary } from "./data"

// Old callers keep their JSON contract, but every booking now uses the personal ledger.
export async function legacyCoachingSchedule(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error)
    return NextResponse.json(
      { error: "Unable to verify account" },
      { status: 500 }
    )
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  if (!canEditOrganization(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  try {
    const summary = await resolveCoachingCreditSummary({
      supabase,
      orgId,
      userId: user.id,
    })
    const tier = summary.priceTier === "included" ? "free" : summary.priceTier
    const coach = normalizeCoachingCoachId(
      new URL(request.url).searchParams.get("coach")
    )
    await createNotification(supabase as never, {
      userId: user.id,
      orgId,
      title: "Coaching scheduling opened",
      description:
        "Choose a time in Coaching. Credits are reserved when your booking is confirmed.",
      href: "/coaching",
      tone: "info",
      type: "coaching_schedule_opened",
      actorId: user.id,
      metadata: { tier, coach },
    })
    return NextResponse.json({
      url: "/coaching",
      tier,
      coach,
      remaining: summary.available,
    })
  } catch {
    return NextResponse.json(
      { error: "Unable to load coaching credits" },
      { status: 503 }
    )
  }
}
