import { NextResponse } from "next/server"

import { env } from "@/lib/env"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase"
import {
  COACHING_INCLUDED_SESSION_LIMIT,
  getCoachingRemainingSessions,
  resolveCoachingTier,
  type CoachingTier,
} from "@/lib/meetings"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import { createNotification } from "@/lib/notifications"

const LEGACY_MEETING_URL =
  process.env.NEXT_PUBLIC_MEETING_JOEL_URL ?? process.env.NEXT_PUBLIC_MEETING_PAULA_URL ?? ""
const DEFAULT_PRO_INCLUDED_MEETING_URL = "https://calendar.app.google/EKs5A4iaXFAbFSp57"
const DEFAULT_FULL_RATE_MEETING_URL = "https://calendar.app.google/qJWKyoF4Yhip6i687"

const MEETING_LINKS: Record<CoachingTier, string> = {
  free: env.NEXT_PUBLIC_MEETING_FREE_URL ?? DEFAULT_PRO_INCLUDED_MEETING_URL,
  discounted: env.NEXT_PUBLIC_MEETING_DISCOUNTED_URL ?? LEGACY_MEETING_URL,
  full: env.NEXT_PUBLIC_MEETING_FULL_URL ?? DEFAULT_FULL_RATE_MEETING_URL,
}

export async function GET(_request: Request) {
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
  const subscriptionResult = await supabase
    .from("subscriptions")
    .select("status, metadata")
    .in("user_id", subscriptionUserIds)
    .in("status", ["active", "trialing"])
    .returns<Array<{ status: string; metadata: Record<string, unknown> | null }>>()

  if (!subscriptionResult.error) {
    const acceleratorSubscriptions = (subscriptionResult.data ?? []).filter((subscription) => {
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

  const tier = resolveCoachingTier({ hasIncludedCoaching, freeSessionsUsed })
  const scheduleUrl = MEETING_LINKS[tier]

  if (!scheduleUrl) {
    return NextResponse.json({ error: "Scheduling link unavailable." }, { status: 400 })
  }

  const nextProfile = {
    ...profile,
    meeting_requests:
      tier === "free" ? Math.min(freeSessionsUsed + 1, COACHING_INCLUDED_SESSION_LIMIT) : freeSessionsUsed,
    meeting_requests_last: new Date().toISOString(),
  }

  const { error: upsertError } = await supabase
    .from("organizations")
    .upsert({ user_id: orgId, profile: nextProfile as Json })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  const notifyResult = await createNotification(supabase, {
    userId: user.id,
    title: "Coaching link opened",
    description: "Your scheduling link is ready. Pick a time that works best.",
    tone: "info",
    type: "coaching_requested",
    actorId: user.id,
    metadata: { tier },
  })
  if ("error" in notifyResult) {
    console.error("Failed to create coaching notification", notifyResult.error)
  }

  const remaining = hasIncludedCoaching ? getCoachingRemainingSessions(nextProfile.meeting_requests) : null

  return NextResponse.json({
    url: scheduleUrl,
    tier,
    remaining,
  })
}
