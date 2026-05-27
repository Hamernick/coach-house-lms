import { NextResponse } from "next/server"

import { resolvePaidPlanTierFromMetadata } from "@/lib/billing/plan-tier"
import { env } from "@/lib/env"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  type CoachingCoachId,
  getCoachingRemainingSessions,
  normalizeCoachingCoachId,
  resolveCoachingTier,
  type CoachingTier,
} from "@/lib/meetings"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import { createNotification } from "@/lib/notifications"
import type { Json } from "@/lib/supabase"
import { trackUserJourneyMilestone } from "@/lib/user-journey"

const LEGACY_MEETING_URL =
  process.env.NEXT_PUBLIC_MEETING_JOEL_URL ?? process.env.NEXT_PUBLIC_MEETING_PAULA_URL ?? ""
const DEFAULT_PRO_INCLUDED_MEETING_URL = "https://calendar.app.google/EKs5A4iaXFAbFSp57"
const DEFAULT_FULL_RATE_MEETING_URL = "https://calendar.app.google/qJWKyoF4Yhip6i687"

const MEETING_LINKS: Record<CoachingTier, string> = {
  free: env.NEXT_PUBLIC_MEETING_FREE_URL ?? DEFAULT_PRO_INCLUDED_MEETING_URL,
  discounted: env.NEXT_PUBLIC_MEETING_DISCOUNTED_URL ?? LEGACY_MEETING_URL,
  full: env.NEXT_PUBLIC_MEETING_FULL_URL ?? DEFAULT_FULL_RATE_MEETING_URL,
}

function resolveCoachMeetingLink({
  coach,
  tier,
}: {
  coach: CoachingCoachId
  tier: CoachingTier
}) {
  if (coach === "paula") {
    if (tier === "free") return process.env.NEXT_PUBLIC_MEETING_PAULA_FREE_URL
    if (tier === "discounted") {
      return (
        process.env.NEXT_PUBLIC_MEETING_PAULA_DISCOUNTED_URL ??
        process.env.NEXT_PUBLIC_MEETING_PAULA_URL
      )
    }
    return (
      process.env.NEXT_PUBLIC_MEETING_PAULA_FULL_URL ??
      process.env.NEXT_PUBLIC_MEETING_PAULA_URL
    )
  }

  if (tier === "free") return process.env.NEXT_PUBLIC_MEETING_JOEL_FREE_URL
  if (tier === "discounted") {
    return (
      process.env.NEXT_PUBLIC_MEETING_JOEL_DISCOUNTED_URL ??
      process.env.NEXT_PUBLIC_MEETING_JOEL_URL
    )
  }
  return (
    process.env.NEXT_PUBLIC_MEETING_JOEL_FULL_URL ??
    process.env.NEXT_PUBLIC_MEETING_JOEL_URL
  )
}

function resolveMeetingLink({
  coach,
  tier,
}: {
  coach: CoachingCoachId
  tier: CoachingTier
}) {
  return resolveCoachMeetingLink({ coach, tier }) ?? MEETING_LINKS[tier]
}

export async function GET(request: Request) {
  const coach = normalizeCoachingCoachId(new URL(request.url).searchParams.get("coach"))
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    return NextResponse.json({ error: orgError.message }, { status: 500 })
  }

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const freeSessionsUsed = typeof profile.meeting_requests === "number" ? profile.meeting_requests : 0

  let hasIncludedCoaching = false

  const purchasesResult = await supabase
    .from("accelerator_purchases")
    .select("id, coaching_included")
    .eq("user_id", user.id)
    .eq("status", "active")
    .returns<Array<{ id: string; coaching_included: boolean | null }>>()

  if (purchasesResult.error) {
    const code = (purchasesResult.error as { code?: string }).code
    if (code !== "42703") {
      return NextResponse.json({ error: purchasesResult.error.message }, { status: 500 })
    }

    // Backward compatibility for environments before coaching_included migration.
    const legacyResult = await supabase
      .from("accelerator_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .returns<Array<{ id: string }>>()

    if (legacyResult.error) {
      return NextResponse.json({ error: legacyResult.error.message }, { status: 500 })
    }

    const hasLegacyPurchase = (legacyResult.data ?? []).length > 0
    hasIncludedCoaching = hasLegacyPurchase
  } else {
    const purchases = purchasesResult.data ?? []
    hasIncludedCoaching = purchases.some((purchase) => purchase.coaching_included !== false)
  }

  const subscriptionUserIds = Array.from(new Set([user.id, orgId]))
  let hasDiscountAccess = false
  const subscriptionResult = await supabase
    .from("subscriptions")
    .select("status, metadata")
    .in("user_id", subscriptionUserIds)
    .in("status", ["active", "trialing"])
    .returns<Array<{ status: string; metadata: Record<string, unknown> | null }>>()

  if (!subscriptionResult.error) {
    const subscriptions = subscriptionResult.data ?? []
    hasDiscountAccess = subscriptions.some(
      (subscription) =>
        resolvePaidPlanTierFromMetadata((subscription.metadata ?? null) as Json | null) ===
        "operations_support",
    )
    const acceleratorSubscriptions = subscriptions.filter((subscription) => {
      const metadata = subscription.metadata ?? {}
      return typeof metadata.kind === "string" && metadata.kind === "accelerator"
    })
    if (acceleratorSubscriptions.length > 0) {
      const includesCoaching = acceleratorSubscriptions.some((subscription) => {
        const metadata = subscription.metadata ?? {}
        if (typeof metadata.coaching_included === "string") {
          return metadata.coaching_included === "true"
        }
        if (typeof metadata.accelerator_variant === "string") {
          return metadata.accelerator_variant !== "without_coaching"
        }
        return false
      })
      hasIncludedCoaching = hasIncludedCoaching || includesCoaching
    }
  }

  const tier = resolveCoachingTier({ hasIncludedCoaching, freeSessionsUsed, hasDiscountAccess })
  const scheduleUrl = resolveMeetingLink({ coach, tier })

  if (!scheduleUrl) {
    return NextResponse.json({ error: "Scheduling link unavailable." }, { status: 400 })
  }

  const notifyResult = await createNotification(supabase, {
    userId: user.id,
    title: "Coaching link opened",
    description: "Your scheduling link is ready. Pick a time that works best.",
    tone: "info",
    type: "coaching_requested",
    actorId: user.id,
    metadata: { tier, coach },
  })
  if ("error" in notifyResult) {
    console.error("Failed to create coaching notification", notifyResult.error)
  }

  const remaining = hasIncludedCoaching ? getCoachingRemainingSessions(freeSessionsUsed) : null
  await trackUserJourneyMilestone({
    userId: user.id,
    orgId,
    eventName: "coaching_schedule_opened",
    journey: "coaching",
    source: "meetings_schedule_route",
    surface: "coaching_schedule",
    checkpoint: "first_coaching_schedule_opened",
    metadata: {
      tier,
      coach,
      remaining,
      hasIncludedCoaching,
      previousFreeSessionsUsed: freeSessionsUsed,
      nextFreeSessionsUsed: freeSessionsUsed,
      legacyLinkOpenCounterDisabled: true,
    },
  })

  return NextResponse.json({
    url: scheduleUrl,
    tier,
    coach,
    remaining,
  })
}
