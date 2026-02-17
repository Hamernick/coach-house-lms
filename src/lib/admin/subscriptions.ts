import { createSupabaseServerClient } from "@/lib/supabase/server"
import { supabaseErrorToError } from "@/lib/supabase/errors"

type SubscriptionMetadata = {
  planName?: string | null
  planAmount?: number | null
  planCurrency?: string | null
}

export type AdminSubscriptionEntry = {
  id: string
  userId: string
  userLabel: string
  status: string
  planName: string | null
  amount: number | null
  currency: string | null
  currentPeriodEnd: string | null
  updatedAt: string | null
}

export async function fetchRecentSubscriptions(limit = 50): Promise<AdminSubscriptionEntry[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, status, current_period_end, metadata, updated_at")
    .not("stripe_subscription_id", "ilike", "stub_%")
    .order("updated_at", { ascending: false })
    .limit(limit)
    .returns<Array<{
      id: string
      user_id: string
      status: string | null
      current_period_end: string | null
      metadata: unknown
      updated_at: string | null
    }>>()

  if (error) {
    throw supabaseErrorToError(error, "Unable to load subscriptions.")
  }

  const rows = data ?? []
  const userIds = Array.from(new Set(rows.map((row) => row.user_id)))
  const userLabelById = new Map<string, string>()

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds)
      .returns<Array<{ id: string; full_name: string | null; email: string | null }>>()

    if (profileError) {
      throw supabaseErrorToError(profileError, "Unable to load user profiles.")
    }

    for (const profile of profiles ?? []) {
      const label = profile.full_name?.trim() || profile.email?.trim() || profile.id
      userLabelById.set(profile.id, label)
    }
  }

  return rows.map((row) => {
    const meta = (row.metadata ?? null) as SubscriptionMetadata | null
    return {
      id: row.id,
      userId: row.user_id,
      userLabel: userLabelById.get(row.user_id) ?? row.user_id,
      status: row.status ?? "unknown",
      planName: meta?.planName ?? null,
      amount: typeof meta?.planAmount === "number" ? meta?.planAmount : null,
      currency: meta?.planCurrency ?? null,
      currentPeriodEnd: row.current_period_end ?? null,
      updatedAt: row.updated_at ?? null,
    }
  })
}
