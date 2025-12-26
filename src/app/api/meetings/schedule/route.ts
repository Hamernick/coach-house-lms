import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase"
import { FREE_TIER_MEETING_LIMIT, isFreeTierSubscription } from "@/lib/meetings"

const HOSTS: Record<string, string> = {
  joel: process.env.NEXT_PUBLIC_MEETING_JOEL_URL ?? "",
  paula: process.env.NEXT_PUBLIC_MEETING_PAULA_URL ?? "",
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const host = searchParams.get("host") ?? ""
  const scheduleUrl = HOSTS[host]

  if (!scheduleUrl) {
    return NextResponse.json({ error: "Scheduling link unavailable." }, { status: 400 })
  }

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

  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", user.id)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 })
  }

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const meetingCount = typeof profile.meeting_requests === "number" ? profile.meeting_requests : 0

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ status: string | null; metadata: Json | null }>()

  const freeTier = isFreeTierSubscription(subscription ?? null)
  if (freeTier && meetingCount >= FREE_TIER_MEETING_LIMIT) {
    return NextResponse.json({ error: "Free tier meeting limit reached." }, { status: 403 })
  }

  const nextProfile = {
    ...profile,
    meeting_requests: meetingCount + 1,
    meeting_requests_last: new Date().toISOString(),
  }

  const { error: upsertError } = await supabase
    .from("organizations")
    .upsert({ user_id: user.id, profile: nextProfile as Json })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({
    url: scheduleUrl,
    remaining: freeTier ? Math.max(0, FREE_TIER_MEETING_LIMIT - (meetingCount + 1)) : null,
  })
}
